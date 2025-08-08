import requests
import json
import os
import shutil

BASE_URL = "http://localhost:8000"

def test_simulate_endpoint():
    """
    Sends a test request to the /simulate endpoint of the ML service.
    
    This requires a model to be trained and the processed_data.csv file to be
    in the ml-service/data directory.
    """
    url = f"{BASE_URL}/simulate"
    
    # You must have a pre-trained model for this to work.
    if not os.path.exists("D:\Development\ABB\p3\data\model.joblib"):
        print("Error: Model not found. Please run the training script first.")
        return
        
    payload = {
        "simulationStart": "2025-10-02 00:00:06",
        "simulationEnd": "2025-10-31 00:00:39"
    }

    print(f"\n--- Testing POST {url} ---")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("\nSimulation was successful!")
            response_json = response.json()
            if response_json and 'results' in response_json:
                print(f"Simulation returned {len(response_json['results'])} records.")
                # Print the first 5 results for a quick check
                print("First 5 results:")
                print(json.dumps(response_json['results'][:5], indent=2))
            else:
                print("Simulation completed, but no results were returned.")
        else:
            print(f"Error details: {response.json().get('detail', 'No detail provided')}")

    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_simulate_endpoint()