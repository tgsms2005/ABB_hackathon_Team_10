using Microsoft.AspNetCore.Mvc;
using System.Text;
using CsvHelper;
using System.Globalization;
using System.IO;
using System.Text.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Cryptography;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
        builder => builder
            .WithOrigins("http://localhost:4200")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("CorsPolicy");

var processedDataFilePath = "data/processed_data.csv";
Directory.CreateDirectory("data");

async Task<List<dynamic>> LoadProcessedDataAsync()
{
    if (!File.Exists(processedDataFilePath))
    {
        return new List<dynamic>();
    }

    using var reader = new StreamReader(processedDataFilePath);
    using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
    var records = await csv.GetRecordsAsync<dynamic>().ToListAsync();
    return records;
}

(bool isValid, string message) ValidateDateRanges(Dictionary<string, string> ranges, DateTime? earliestTimestamp, DateTime? latestTimestamp)
{
    if (ranges == null || !ranges.TryGetValue("trainingStart", out var trainingStartStr) || !ranges.TryGetValue("trainingEnd", out var trainingEndStr) ||
        !ranges.TryGetValue("testingStart", out var testingStartStr) || !ranges.TryGetValue("testingEnd", out var testingEndStr) ||
        !ranges.TryGetValue("simulationStart", out var simulationStartStr) || !ranges.TryGetValue("simulationEnd", out var simulationEndStr))
    {
        return (false, "Missing date range parameters.");
    }

    if (!DateTime.TryParse(trainingStartStr, out var trainingStart) ||
        !DateTime.TryParse(trainingEndStr, out var trainingEnd) ||
        !DateTime.TryParse(testingStartStr, out var testingStart) ||
        !DateTime.TryParse(testingEndStr, out var testingEnd) ||
        !DateTime.TryParse(simulationStartStr, out var simulationStart) ||
        !DateTime.TryParse(simulationEndStr, out var simulationEnd))
    {
        return (false, "Invalid date format.");
    }

    if (trainingStart > trainingEnd || testingStart > testingEnd || simulationStart > simulationEnd)
    {
        return (false, "Start date must be before or equal to end date.");
    }

    if (testingStart <= trainingEnd || simulationStart <= testingEnd)
    {
        return (false, "Date ranges must be sequential and non-overlapping.");
    }

    if (earliestTimestamp.HasValue && trainingStart < earliestTimestamp.Value)
    {
        return (false, "Training start date is outside the dataset range.");
    }
    
    if (latestTimestamp.HasValue && simulationEnd > latestTimestamp.Value)
    {
        return (false, "Simulation end date is outside the dataset range.");
    }

    return (true, "Date ranges are valid.");
}

app.MapPost("/api/upload", async (HttpContext context) =>
{
    var file = context.Request.Form.Files["file"];
    var username = context.Request.Headers["X-Username"].FirstOrDefault();
    if (file == null || file.Length == 0 || !file.FileName.EndsWith(".csv"))
    {
        return Results.BadRequest("Invalid file. Please upload a CSV file.");
    }
    if (string.IsNullOrEmpty(username))
    {
        return Results.BadRequest("Username is required.");
    }

    try
    {
        using var reader = new StreamReader(file.OpenReadStream());
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        var records = await csv.GetRecordsAsync<dynamic>().ToListAsync();

        var startTime = new DateTime(2025, 8, 5, 0, 0, 0);
        var headers = (records.FirstOrDefault() as IDictionary<string, object>)?.Keys.ToList() ?? new List<string>();
        
        if (!headers.Contains("Response"))
        {
            return Results.BadRequest("CSV must contain a 'Response' column.");
        }

        for (int i = 0; i < records.Count; i++)
        {
            var record = records[i] as IDictionary<string, object>;
            record["synthetic_timestamp"] = startTime.AddHours(i).ToString("yyyy-MM-dd HH:mm:ss");
        }

        await using (var writer = new StreamWriter(processedDataFilePath))
        await using (var csvWriter = new CsvWriter(writer, CultureInfo.InvariantCulture))
        {
            await csvWriter.WriteRecordsAsync(records);
        }

        int totalRecords = records.Count;
        int totalColumns = (records.FirstOrDefault() as IDictionary<string, object>)?.Count ?? 0;
        int passCount = records.Count(r => (r as IDictionary<string, object>)?.TryGetValue("Response", out var response) == true && response?.ToString() == "1");
        double passRate = totalRecords > 0 ? (double)passCount / totalRecords : 0;

        var earliestTimestamp = (records.First() as IDictionary<string, object>)?["synthetic_timestamp"];
        var latestTimestamp = (records.Last() as IDictionary<string, object>)?["synthetic_timestamp"];

        var metadata = new
        {
            username,
            fileName = file.FileName,
            uploadDate = DateTime.UtcNow.ToString("s"),
            totalRecords,
            totalColumns,
            passRate,
            dateRange = $"{earliestTimestamp} to {latestTimestamp}"
        };

        // --- Save upload history ---
        var historyPath = "data/upload_history.json";
        List<object> history = new();
        if (File.Exists(historyPath))
        {
            var json = await File.ReadAllTextAsync(historyPath);
            history = JsonSerializer.Deserialize<List<object>>(json) ?? new List<object>();
        }
        history.Add(metadata);
        await File.WriteAllTextAsync(historyPath, JsonSerializer.Serialize(history, new JsonSerializerOptions { WriteIndented = true }));

        return Results.Ok(metadata);
    }
    catch (Exception ex)
    {
        return Results.Problem($"File processing failed: {ex.Message}");
    }
}).DisableAntiforgery();

app.MapPost("/api/validate-ranges", async (HttpContext context) =>
{
    try
    {
        var ranges = await context.Request.ReadFromJsonAsync<Dictionary<string, string>>();
        var data = await LoadProcessedDataAsync();
        
        DateTime? earliestTimestamp = null;
        DateTime? latestTimestamp = null;

        if (data.Any())
        {
            earliestTimestamp = DateTime.Parse((data.First() as IDictionary<string, object>)!["synthetic_timestamp"].ToString());
            latestTimestamp = DateTime.Parse((data.Last() as IDictionary<string, object>)!["synthetic_timestamp"].ToString());
        }

        var (isValid, message) = ValidateDateRanges(ranges!, earliestTimestamp, latestTimestamp);

        if (!isValid)
        {
            return Results.BadRequest(new { status = "Invalid", message = message });
        }
        
        var records = data.Where(r => (r as IDictionary<string, object>)!.ContainsKey("synthetic_timestamp")).ToList();
        
        var trainingRecords = records.Count(r => 
        {
            var timestamp = DateTime.Parse(((IDictionary<string, object>)r!)["synthetic_timestamp"].ToString());
            return timestamp >= DateTime.Parse(ranges!["trainingStart"]) && 
                   timestamp <= DateTime.Parse(ranges!["trainingEnd"]);
        });
        
        var testingRecords = records.Count(r => 
        {
            var timestamp = DateTime.Parse(((IDictionary<string, object>)r!)["synthetic_timestamp"].ToString());
            return timestamp >= DateTime.Parse(ranges!["testingStart"]) && 
                   timestamp <= DateTime.Parse(ranges!["testingEnd"]);
        });
        
        var simulationRecords = records.Count(r => 
        {
            var timestamp = DateTime.Parse(((IDictionary<string, object>)r!)["synthetic_timestamp"].ToString());
            return timestamp >= DateTime.Parse(ranges!["simulationStart"]) && 
                   timestamp <= DateTime.Parse(ranges!["simulationEnd"]);
        });
        
        var recordsCount = new 
        {
            trainingCount = trainingRecords,
            testingCount = testingRecords,
            simulationCount = simulationRecords
        };
        
        return Results.Ok(new { status = "Valid", counts = recordsCount });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Validation failed: {ex.Message}");
    }
});

app.MapPost("/api/train", async (HttpClient httpClient, Dictionary<string, string> requestBody) =>
{
    try
    {
        var mlServiceUrl = app.Configuration["ML_SERVICE_URL"] ?? "http://ml-service:8000";
        var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));
        var response = await httpClient.PostAsync($"{mlServiceUrl}/train-model", jsonContent, cts.Token);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            return Results.Problem(errorContent, statusCode: (int)response.StatusCode);
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        return Results.Content(responseBody, "application/json");
    }
    catch (TaskCanceledException)
    {
        return Results.Problem("Training request timed out.", statusCode: 408);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Training request failed: {ex.Message}");
    }
});

app.MapPost("/api/simulate", async (HttpClient httpClient, Dictionary<string, string> requestBody) =>
{
    try
    {
        if (requestBody == null || !requestBody.Any())
        {
            return Results.BadRequest(new { error = "Request body is required" });
        }

        if (!requestBody.ContainsKey("simulationStart") || !requestBody.ContainsKey("simulationEnd"))
        {
            return Results.BadRequest(new { 
                error = "Missing required parameters",
                required = new[] { "simulationStart", "simulationEnd" }
            });
        }

        var mlRequest = new Dictionary<string, object>
        {
            ["simulationStart"] = requestBody["simulationStart"],
            ["simulationEnd"] = requestBody["simulationEnd"],
            ["modelId"] = requestBody.ContainsKey("modelId") ? requestBody["modelId"] : "default"
        };

        var mlServiceUrl = app.Configuration["ML_SERVICE_URL"] ?? "http://ml-service:8000";
        var jsonContent = new StringContent(
            JsonSerializer.Serialize(mlRequest),
            Encoding.UTF8,
            "application/json"
        );

        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(2));
        
        app.Logger.LogInformation($"Sending simulation request to ML service: {JsonSerializer.Serialize(mlRequest)}");
        
        var response = await httpClient.PostAsync($"{mlServiceUrl}/simulate", jsonContent, cts.Token);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            app.Logger.LogError($"ML service returned error: {errorContent}");
            
            try
            {
                var errorResponse = JsonSerializer.Deserialize<Dictionary<string, string>>(errorContent);
                return Results.Problem(
                    detail: errorResponse?.GetValueOrDefault("detail", errorContent),
                    statusCode: (int)response.StatusCode
                );
            }
            catch
            {
                return Results.Problem(
                    detail: errorContent,
                    statusCode: (int)response.StatusCode
                );
            }
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        app.Logger.LogInformation("Simulation completed successfully");
        
        return Results.Json(
            JsonSerializer.Deserialize<object>(responseBody),
            statusCode: (int)response.StatusCode
        );
    }
    catch (Exception ex)
    {
        app.Logger.LogError($"Simulation failed: {ex}");
        return Results.Problem(
            detail: $"Simulation failed: {ex.Message}",
            statusCode: 500
        );
    }
});



app.MapPost("/api/login", async ([FromBody] LoginRequest login) =>
{
    var usersPath = "data/users.json";
    if (!File.Exists(usersPath))
        return Results.Unauthorized();

    var usersJson = await File.ReadAllTextAsync(usersPath);
    var users = JsonSerializer.Deserialize<List<User>>(usersJson) ?? new();

    var user = users.FirstOrDefault(u => u.Username == login.Username && u.Password == login.Password);
    if (user == null)
        return Results.Unauthorized();

    var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    return Results.Ok(new { token, isAdmin = user.IsAdmin });
});



app.MapGet("/api/uploads", (HttpContext context) =>
{
    var username = context.Request.Headers["X-Username"].FirstOrDefault();
    var historyPath = "data/upload_history.json";
    if (!File.Exists(historyPath) || string.IsNullOrEmpty(username))
        return Results.Ok(new List<object>());

    var json = File.ReadAllText(historyPath);
    var history = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json) ?? new();
    var userHistory = history.Where(h => h.GetValueOrDefault("username")?.ToString() == username).ToList();
    return Results.Ok(userHistory);
});

app.MapGet("/api/dataset-summary", () =>
{
    var historyPath = "data/upload_history.json";
    if (!File.Exists(historyPath))
        return Results.Ok(null);

    var json = File.ReadAllText(historyPath);
    var history = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json);
    var latest = history?.LastOrDefault();
    return Results.Ok(latest);
});

app.MapGet("/api/stats", () =>
{
    var historyPath = "data/upload_history.json";
    if (!File.Exists(historyPath))
        return Results.Ok(new { totalUploads = 0, totalRecords = 0, lastUpload = "" });

    var json = File.ReadAllText(historyPath);
    var history = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json) ?? new();

    int totalUploads = history.Count;
    int totalRecords = 0;
    string lastUpload = "";

    foreach (var h in history)
    {
        if (h.TryGetValue("totalRecords", out var val) && val != null)
        {
            if (val is JsonElement je && je.ValueKind == JsonValueKind.Number)
                totalRecords += je.GetInt32();
            else if (val is int i)
                totalRecords += i;
            else if (int.TryParse(val.ToString(), out var parsed))
                totalRecords += parsed;
        }
    }

    var last = history.LastOrDefault();
    if (last != null && last.TryGetValue("uploadDate", out var dateVal) && dateVal != null)
    {
        if (dateVal is JsonElement je && je.ValueKind == JsonValueKind.String)
            lastUpload = je.GetString() ?? "";
        else
            lastUpload = dateVal.ToString() ?? "";
    }

    return Results.Ok(new { totalUploads, totalRecords, lastUpload });
});

app.Run();
record LoginRequest(string Username, string Password);
record User(string Username, string Password, bool IsAdmin);