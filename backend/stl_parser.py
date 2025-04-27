import pandas as pd
import re
from datetime import datetime

def parse_stl_file(file_path):
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Split into entries
    entries = content.strip().split('\n\n')
    
    # Initialize lists to store data
    data = []
    
    for entry in entries:
        if not entry.strip():
            continue
            
        # Split into lines
        lines = entry.strip().split('\n')
        if len(lines) < 2:
            continue
            
        # Parse timestamp
        timestamp_line = lines[1]
        timestamp_match = re.search(r'(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})', timestamp_line)
        if not timestamp_match:
            continue
            
        start_time = timestamp_match.group(1)
        
        # Convert timestamps to seconds
        def time_to_seconds(time_str):
            h, m, s = time_str.split(':')
            s, ms = s.split(',')
            return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
        
        start_seconds = time_to_seconds(start_time)
        
        # Parse data line
        data_line = lines[2]
        
        # Extract GPS coordinates
        gps_match = re.search(r'GPS \((-?\d+\.\d+), (-?\d+\.\d+), (-?\d+)\)', data_line)
        
        # Extract drone metrics
        d_match = re.search(r'D (\d+\.\d+)m', data_line)
        h_match = re.search(r'H (-?\d+\.\d+)m', data_line)
        hs_match = re.search(r'H.S (-?\d+\.\d+)m/s', data_line)
        vs_match = re.search(r'V.S (-?\d+\.\d+)m/s', data_line)
        
        # Create dictionary with parsed data
        entry_data = {
            'start_seconds': int(start_seconds),
            'gps_lat': float(gps_match.group(1)) if gps_match else None,
            'gps_lon': float(gps_match.group(2)) if gps_match else None,
            'gps_alt': int(gps_match.group(3)) if gps_match else None,
            'distance': float(d_match.group(1)) if d_match else None,
            'height': float(h_match.group(1)) if h_match else None,
            'horizontal_speed': float(hs_match.group(1)) if hs_match else None,
            'vertical_speed': float(vs_match.group(1)) if vs_match else None
        }
        
        data.append(entry_data)
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    return df

def process_input(input_path):
    df = parse_stl_file(input_path)
    print(f"Parsed {len(df)} entries from STL file")
    print("\nFirst few rows:")
    print(df.head())
    print("\nDataFrame info:")
    print(df.info())
    
    # Save to CSV
    output_path = input_path.replace('.stl', '.csv')
    df.to_csv(output_path, index=False)
    print(f"\nSaved DataFrame to {output_path}")
    
    return df

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Needs to be in format: python stl-parser.py <path_to_file>")
    else:
        process_input(sys.argv[1])