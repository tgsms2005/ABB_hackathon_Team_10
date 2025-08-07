# IntelliInspect: Predictive Quality Control

This is an end-to-end, full-stack application designed as a solution for the **Bosch Production Line Performance Hackathon**. It demonstrates a complete machine learning lifecycle — from data ingestion to real-time predictive simulation.

Developed by: 
  - Mayank Sharma
  - Manupati Raju
  - Punnam Pardeep
  - Shivakrishnan

---

## 🔧 Features

- **Multi-service Architecture**  
  The application consists of three main services:
  - Frontend (Angular)
  - Backend API (.NET)
  - ML Service (Python)

- **Docker-based Deployment**  
  The entire stack is containerized for easy setup and deployment.

- **Dataset Upload**  
  Users can upload a CSV dataset to initiate the workflow.

- **Data Preprocessing**  
  The backend processes the uploaded data and augments it with synthetic timestamps.

- **Model Training**  
  The ML service trains a classification model using XGBoost on user-defined date ranges.

- **Real-time Simulation**  
  The application simulates a real-time stream of predictions using the trained model.

---

## ⚙️ Setup and Deployment Instructions (Docker-based)

### 1. Prerequisites

Make sure you have the following installed:

- **Git**: For cloning the repository  
- **Angular**: v20.1.4  
- **Node.js**: v22.18.0  
- **Docker & Docker Compose**: Docker Compose v8+

---

### 2. Run the Docker Containers

1. Open your terminal and navigate to the root of your project.
2. Run the following command:

   ```bash
   docker-compose up --build
   ```

   This command will build the images for all three services and start them in the correct order.

   - Application URL: `http://localhost:4200`

---

### 3. Accessing the Application

| Service         | URL                       |
|-----------------|---------------------------|
| Frontend        | http://localhost:4200     |
| Backend API     | http://localhost:5000     |
| ML Service API  | http://localhost:8000     |

You can now use the frontend to upload the `data/synthetic_dataset_10k.csv` file and proceed with the workflow.

---

## 📘 Usage Guide

Follow the steps below to interact with the IntelliInspect system.

### 1. 📤 Upload Dataset

1. Open your browser and go to: [http://localhost:4200](http://localhost:4200)
2. Navigate to the **"Upload Dataset"** tab.
3. Click or drag & drop your CSV file (e.g., `data/synthetic_dataset_10k.csv`) into the upload area.
4. A metadata card will appear showing:
   - Total number of records
   - Pass rate
   - Date range of the dataset

---

### 2. 📅 Define Date Ranges

1. Click the **"Next"** button to go to the **"Date Ranges"** tab.
2. Use the date pickers to define **three non-overlapping time periods**:
   - **Training Period** – used for training the model
   - **Testing Period** – used for evaluating the model
   - **Simulation Period** – used for real-time simulation
3. Click the **"Validate Ranges"** button.
   - The app will validate the ranges and show record counts for each.

---

### 3. 🧠 Model Training

1. Click **"Next"** to access the **"Model Training"** tab.
2. Click **"Train Model"** to start training.
   - A progress bar will indicate the training status.
3. After completion, the following metrics will be displayed:
   - Accuracy
   - Precision
   - Recall
   - F1-Score

---

### 4. 🔮 Real-time Simulation

1. Click **"Next"** to open the **"Simulation"** tab.
2. Click **"Start Simulation"** to begin the live prediction stream.
3. You’ll see:
   - A table of live predictions
   - Summary of:
     - Total predictions
     - Pass/Fail counts
     - Average confidence score

---

**Happy Predicting!**