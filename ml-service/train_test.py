import requests
import json
import os
import shutil

BASE_URL = "http://localhost:8000"

def copy_processed_data():
    # source = "D:/Development/ABB/p3/data/test_data.csv"
    source = "D:/Development/ABB/p3/data/processed_data.csv"
    destination_dir = "D:/Development/ABB/p3/ml-service/data"
    destination_file = os.path.join(destination_dir, "processed_data.csv")
    
    if not os.path.exists(destination_dir):
        os.makedirs(destination_dir)
        
    shutil.copyfile(source, destination_file)
    print(f"Copied {source} to {destination_file} for testing.")
    
def test_train_endpoint():
    url = f"{BASE_URL}/train-model"
    
    payload = {
        "trainStart": "2025-08-06 00:00:00",
        "trainEnd": "2025-09-06 00:00:00",
        "testStart": "2025-09-07 00:00:00",
        "testEnd": "2025-09-22 00:00:00"
    }

    print(f"\n--- Testing POST {url} ---")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print("Response Text:", response.text)
        
        if response.status_code == 200:
            print("\nModel training was successful!")
        else:
            print(f"Error details: {response.json()}")

    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    copy_processed_data()
    test_train_endpoint()