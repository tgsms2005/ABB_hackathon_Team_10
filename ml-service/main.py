from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
import xgboost as xgb
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from typing import Dict, Any, List
import os
import numpy as np
from datetime import datetime
import pytz

app = FastAPI()

MODEL_PATH = "data/model.joblib"
PROCESSED_DATA_PATH = "data/processed_data.csv"
MODEL_FEATURES_PATH = "data/model_features.joblib"

class TrainRequest(BaseModel):
    trainStart: str
    trainEnd: str
    testStart: str
    testEnd: str

class PredictRequest(BaseModel):
    data: Dict[str, Any]

def convert_to_utc_datetime(date_str: str) -> pd.Timestamp:
    """Convert input date string to UTC Timestamp"""
    try:
        # Try parsing with timezone info
        dt = pd.to_datetime(date_str, utc=True)
        if dt.tzinfo is None:
            # If no timezone info, assume UTC
            dt = pd.to_datetime(date_str).tz_localize('UTC')
        return dt
    except Exception as e:
        raise ValueError(f"Invalid date format: {date_str}. Error: {str(e)}")

# @app.post("/train-model")
# async def train_model(request: TrainRequest):
#     print("--- Starting training process ---")
    
#     if not os.path.exists(PROCESSED_DATA_PATH):
#         print(f"Error: Processed data file not found at {PROCESSED_DATA_PATH}")
#         raise HTTPException(status_code=400, detail="Processed dataset not found. Please upload a file first.")

#     try:
#         print("1. Loading dataset...")
#         # Use chunks for large files
#         chunks = pd.read_csv(PROCESSED_DATA_PATH, parse_dates=['synthetic_timestamp'], chunksize=10000)
#         df = pd.concat(chunks)
        
#         # Ensure timestamp is timezone-aware UTC
#         if df['synthetic_timestamp'].dt.tz is None:
#             df['synthetic_timestamp'] = df['synthetic_timestamp'].dt.tz_localize('UTC')
        
#         print(f"Dataset loaded. Total records: {len(df)}")
        
#         print(f"2. Filtering data for train and test ranges...")
        
#         # Convert request dates to UTC Timestamps
#         trainStart = convert_to_utc_datetime(request.trainStart)
#         trainEnd = convert_to_utc_datetime(request.trainEnd)
#         testStart = convert_to_utc_datetime(request.testStart)
#         testEnd = convert_to_utc_datetime(request.testEnd)

#         # Filter data using pandas Timestamp comparison
#         train_mask = (df['synthetic_timestamp'] >= trainStart) & (df['synthetic_timestamp'] <= trainEnd)
#         test_mask = (df['synthetic_timestamp'] >= testStart) & (df['synthetic_timestamp'] <= testEnd)
        
#         train_data = df.loc[train_mask].copy()
#         test_data = df.loc[test_mask].copy()

#         print(f"Training records found: {len(train_data)}")
#         print(f"Testing records found: {len(test_data)}")
        
#         if train_data.empty or test_data.empty:
#             print("Error: One or more date ranges are empty.")
#             raise HTTPException(status_code=400, detail="One or more date ranges are empty.")

#         print("3. Preprocessing data...")
#         # Optimized preprocessing for large datasets
#         numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
#         if 'Response' in numeric_cols:
#             numeric_cols.remove('Response')
        
#         # Fill NA values efficiently
#         train_data[numeric_cols] = train_data[numeric_cols].fillna(0)
#         test_data[numeric_cols] = test_data[numeric_cols].fillna(0)
        
#         # Ensure Response is numeric
#         train_data['Response'] = pd.to_numeric(train_data['Response'], errors='coerce').fillna(0).astype(int)
#         if 'Response' in test_data.columns:
#             test_data['Response'] = pd.to_numeric(test_data['Response'], errors='coerce').fillna(0).astype(int)
#         else:
#             test_data['Response'] = 0

#         X_train = train_data[numeric_cols]
#         y_train = train_data['Response']
#         X_test = test_data[numeric_cols]
#         y_test = test_data['Response']

#         print("4. Training model with XGBoost (optimized for large datasets)...")
#         # Use DMatrix for efficient memory usage
#         dtrain = xgb.DMatrix(X_train, label=y_train)
#         dtest = xgb.DMatrix(X_test, label=y_test)
        
#         params = {
#             'objective': 'binary:logistic',
#             'eval_metric': 'logloss',
#             'tree_method': 'hist',  # More memory-efficient
#             'grow_policy': 'lossguide'
#         }
        
#         model = xgb.train(
#             params,
#             dtrain,
#             num_boost_round=100,
#             evals=[(dtest, "test")],
#             early_stopping_rounds=10,
#             verbose_eval=10
#         )

#         print("5. Evaluating model performance...")
#         y_pred = model.predict(dtest)
#         y_pred_binary = [1 if p > 0.5 else 0 for p in y_pred]
        
#         metrics = {
#             "accuracy": float(accuracy_score(y_test, y_pred_binary)),
#             "precision": float(precision_score(y_test, y_pred_binary, zero_division=0)),
#             "recall": float(recall_score(y_test, y_pred_binary, zero_division=0)),
#             "f1_score": float(f1_score(y_test, y_pred_binary, zero_division=0))
#         }
#         print(f"Evaluation metrics: {metrics}")

#         print("6. Saving model and features...")
#         os.makedirs("data", exist_ok=True)
#         joblib.dump(model, MODEL_PATH)
#         joblib.dump(numeric_cols, MODEL_FEATURES_PATH)
#         print("Model and features saved successfully.")
        
#         print("--- Training process finished successfully ---")
#         return {"status": "success", "metrics": metrics}

#     except Exception as e:
#         print(f"An unexpected error occurred: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"An error occurred during model training: {str(e)}")

from sklearn.feature_selection import SelectFromModel
from sklearn.metrics import classification_report, confusion_matrix

@app.post("/train-model")
async def train_model(request: TrainRequest):
    print("--- Starting training process ---")

    if not os.path.exists(PROCESSED_DATA_PATH):
        print(f"Error: Processed data file not found at {PROCESSED_DATA_PATH}")
        raise HTTPException(status_code=400, detail="Processed dataset not found. Please upload a file first.")

    try:
        print("1. Loading dataset...")
        chunks = pd.read_csv(PROCESSED_DATA_PATH, parse_dates=['synthetic_timestamp'], chunksize=10000)
        df = pd.concat(chunks)

        if df['synthetic_timestamp'].dt.tz is None:
            df['synthetic_timestamp'] = df['synthetic_timestamp'].dt.tz_localize('UTC')

        print(f"Dataset loaded. Total records: {len(df)}")

        print("2. Filtering data...")
        trainStart = convert_to_utc_datetime(request.trainStart)
        trainEnd = convert_to_utc_datetime(request.trainEnd)
        testStart = convert_to_utc_datetime(request.testStart)
        testEnd = convert_to_utc_datetime(request.testEnd)

        train_mask = (df['synthetic_timestamp'] >= trainStart) & (df['synthetic_timestamp'] <= trainEnd)
        test_mask = (df['synthetic_timestamp'] >= testStart) & (df['synthetic_timestamp'] <= testEnd)

        train_data = df.loc[train_mask].copy()
        test_data = df.loc[test_mask].copy()

        if train_data.empty or test_data.empty:
            raise HTTPException(status_code=400, detail="One or more date ranges are empty.")

        print("3. Preprocessing...")
        numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
        if 'Response' in numeric_cols:
            numeric_cols.remove('Response')

        train_data[numeric_cols] = train_data[numeric_cols].fillna(0)
        test_data[numeric_cols] = test_data[numeric_cols].fillna(0)

        train_data['Response'] = pd.to_numeric(train_data['Response'], errors='coerce').fillna(0).astype(int)
        test_data['Response'] = pd.to_numeric(test_data.get('Response', 0), errors='coerce').fillna(0).astype(int)

        X_train = train_data[numeric_cols]
        y_train = train_data['Response']
        X_test = test_data[numeric_cols]
        y_test = test_data['Response']

        print(f"Positive class ratio: {y_train.sum()} / {len(y_train)}")

        # Class imbalance handling
        scale_pos_weight = float(len(y_train[y_train == 0])) / max(len(y_train[y_train == 1]), 1)

        # Optional: Feature selection
        # selector = SelectFromModel(xgb.XGBClassifier()).fit(X_train, y_train)
        # X_train = selector.transform(X_train)
        # X_test = selector.transform(X_test)
        # numeric_cols = selector.get_feature_names_out()

        print("4. Training XGBoost with imbalance handling...")
        dtrain = xgb.DMatrix(X_train, label=y_train)
        dtest = xgb.DMatrix(X_test, label=y_test)

        params = {
            'objective': 'binary:logistic',
            'eval_metric': 'aucpr',
            'scale_pos_weight': scale_pos_weight,
            'tree_method': 'hist',
            'grow_policy': 'lossguide',
            'verbosity': 1
        }

        model = xgb.train(
            params,
            dtrain,
            num_boost_round=500,
            evals=[(dtest, "test")],
            early_stopping_rounds=25,
            verbose_eval=25
        )

        print("5. Evaluating model...")
        y_pred_probs = model.predict(dtest)
        threshold = 0.3  # Tune this if needed
        y_pred = [1 if p > threshold else 0 for p in y_pred_probs]

        metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, zero_division=0)),
            "f1_score": float(f1_score(y_test, y_pred, zero_division=0))
        }

        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, digits=4))
        print("Confusion Matrix:")
        print(confusion_matrix(y_test, y_pred))

        print("6. Saving model...")
        os.makedirs("data", exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        joblib.dump(numeric_cols, MODEL_FEATURES_PATH)

        print("--- Training complete ---")
        return {"status": "success", "metrics": metrics}

    except Exception as e:
        print(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


@app.post("/predict")
async def predict(request: PredictRequest):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(MODEL_FEATURES_PATH):
        raise HTTPException(status_code=400, detail="Model not trained. Please train a model first.")

    try:
        model = joblib.load(MODEL_PATH)
        model_features = joblib.load(MODEL_FEATURES_PATH)

        input_df = pd.DataFrame([request.data])
        input_df = input_df.reindex(columns=model_features, fill_value=0)

        prediction = model.predict(xgb.DMatrix(input_df))[0]
        confidence_scores = model.predict(xgb.DMatrix(input_df), output_margin=False)[0]
        confidence = float(confidence_scores[1] if prediction == 1 else confidence_scores[0])

        return {
            "prediction": int(prediction),
            "confidence": confidence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/simulate")
async def simulate(request_body: Dict[str, Any]):
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise HTTPException(status_code=400, detail="Dataset not available.")
    
    if not os.path.exists(MODEL_PATH) or not os.path.exists(MODEL_FEATURES_PATH):
        raise HTTPException(status_code=400, detail="Model not trained.")

    try:
        # Process data in chunks for memory efficiency
        chunks = pd.read_csv(PROCESSED_DATA_PATH, parse_dates=['synthetic_timestamp'], chunksize=10000)
        df = pd.concat(chunks)
        
        # Ensure timestamp is timezone-aware UTC
        if df['synthetic_timestamp'].dt.tz is None:
            df['synthetic_timestamp'] = df['synthetic_timestamp'].dt.tz_localize('UTC')

        # Convert request dates
        simulationStart = convert_to_utc_datetime(request_body['simulationStart'])
        simulationEnd = convert_to_utc_datetime(request_body['simulationEnd'])

        simulation_mask = (df['synthetic_timestamp'] >= simulationStart) & (df['synthetic_timestamp'] <= simulationEnd)
        simulation_data = df.loc[simulation_mask].copy()

        if simulation_data.empty:
            raise HTTPException(status_code=400, detail="Simulation data range is empty.")

        model = joblib.load(MODEL_PATH)
        model_features = joblib.load(MODEL_FEATURES_PATH)

        results = []
        # Process in batches for large datasets
        batch_size = 1000
        for i in range(0, len(simulation_data), batch_size):
            batch = simulation_data.iloc[i:i+batch_size]
            X_batch = batch[model_features].fillna(0)
            dmatrix = xgb.DMatrix(X_batch)
            
            # Get predictions and confidence scores
            predictions = model.predict(dmatrix)
            confidences = model.predict(dmatrix, output_margin=False)
            
            for idx, (_, row) in enumerate(batch.iterrows()):
                pred = 1 if predictions[idx] > 0.5 else 0
                
                # Handle both binary and multi-class confidence output
                if isinstance(confidences[idx], np.ndarray):
                    confidence = float(confidences[idx][1]) if pred == 1 else float(confidences[idx][0])
                else:
                    confidence = float(confidences[idx])
                
                # Replace NaN/Inf values with None (which becomes null in JSON)
                confidence = None if np.isnan(confidence) or np.isinf(confidence) else confidence
                
                results.append({
                    "timestamp": row['synthetic_timestamp'].isoformat(),
                    "id": row.get('Id', i + idx),
                    "prediction": int(pred),
                    "confidence": confidence,
                    "parameters": {
                        "temperature": float(row.get("L3_S29_F3430", 25)) if not np.isnan(row.get("L3_S29_F3430", 25)) else None,
                        "pressure": float(row.get("L3_S29_F3429", 1000)) if not np.isnan(row.get("L3_S29_F3429", 1000)) else None,
                        "humidity": float(row.get("L3_S29_F3436", 50)) if not np.isnan(row.get("L3_S29_F3436", 50)) else None
                    }
                })
        
        return {"status": "success", "results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
    