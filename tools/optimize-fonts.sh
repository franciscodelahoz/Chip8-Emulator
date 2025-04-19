#!/bin/bash

#=============================================================================
# Font Optimization Tool
#=============================================================================
#
# This script reduces font file size by subsetting it to include only
# basic Latin characters (U+0000-00FF).
#
# REQUIREMENTS:
# -------------
# 1. fonttools (provides pyftsubset command)
#    - Install with: pip install fonttools
#    - For WOFF2 support: pip install brotli
#
# 2. GNU coreutils (for numfmt command)
#    - On macOS: brew install coreutils
#    - On Linux: Should be pre-installed
#    - On Windows: Use WSL or Git Bash with appropriate packages
#
# USAGE:
# ------
# ./optimize-fonts.sh path/to/font.woff2
#
# The optimized font will be saved in the same directory as the original
# with "-subset" added to the filename.
#=============================================================================

# Check if a file was provided
if [ -z "$1" ]; then
    echo "Error: You must provide a font file."
    echo "Usage: ./optimize-fonts.sh font-file.woff2"
    exit 1
fi

# Check if file exists
if [ ! -f "$1" ]; then
    echo "Error: File '$1' does not exist."
    exit 1
fi

# Extract directory path, filename and extension
DIR_PATH=$(dirname "$1")
FILENAME=$(basename "$1")
BASENAME="${FILENAME%.*}"
EXTENSION="${FILENAME##*.}"
OUTPUT="$DIR_PATH/${BASENAME}-subset.${EXTENSION}"

echo "Optimizing font: $1"
echo "Unicode range: U+0000-00FF (ASCII + Latin-1)"
echo "Output format: woff2"
echo "Output file: $OUTPUT"

# Perform optimization
pyftsubset "$1" --unicodes="U+0000-00FF" --flavor=woff2 --output-file="$OUTPUT"

# Check if operation was successful
if [ $? -eq 0 ]; then
    # Get file sizes
    ORIGINAL_SIZE=$(wc -c < "$1")
    NEW_SIZE=$(wc -c < "$OUTPUT")

    # Calculate reduction percentage
    REDUCTION=$(( (ORIGINAL_SIZE - NEW_SIZE) * 100 / ORIGINAL_SIZE ))

    # Display results
    echo ""
    echo "Optimization completed!"
    echo "Original size: $(numfmt --to=iec-i --suffix=B $ORIGINAL_SIZE)"
    echo "Optimized size: $(numfmt --to=iec-i --suffix=B $NEW_SIZE)"
    echo "Reduction: $REDUCTION%"
else
    echo "Error optimizing font."
    exit 1
fi
