#!/usr/bin/env python3
import subprocess, sys
from pathlib import Path

def extract_subtitles(input_mp4: Path, output_stl: Path, stream_index: int = 0):
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_mp4),
        "-map", f"0:s:{stream_index}",
        "-c:s", "srt",
        "-f", "srt",
        str(output_stl)
    ]
    # print("Extracting subtitles:", " ".join(cmd))
    subprocess.run(cmd, check=True)

def main():
    if len(sys.argv) != 2:
        # print("Usage: python extract_clean.py input.mp4")
        sys.exit(1)

    mp4 = Path(sys.argv[1])
    if not mp4.exists():
        print(f"Error: {mp4} not found.")
        sys.exit(2)

    stl_path = mp4.with_suffix(".stl")
    extract_subtitles(mp4, f"temp/{stl_path}")
    print(f"Subtitles written to: temp/{stl_path}")

if __name__ == "__main__":
    main()
