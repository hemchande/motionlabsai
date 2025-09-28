#!/usr/bin/env python3
"""
Debug script to check API response structure
"""

import requests
import json

API_BASE_URL = 'https://gymnasticsapi.onrender.com'

def debug_api_response():
    """Debug the API response structure"""
    try:
        print("Fetching sessions from production server...")
        response = requests.get(f"{API_BASE_URL}/getSessions", timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response JSON: {json.dumps(data, indent=2)}")
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error: {e}")
                print(f"Raw Response: {response.text}")
        else:
            print(f"Error Response: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_api_response()