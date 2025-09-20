# Quiz CSV Upload Guide

## Overview
You can add quiz questions to modules using CSV format. This allows you to quickly add multiple questions without using the manual form.

## CSV Format

### For Multiple Choice Questions (MCQ)
```
type,prompt,option1,option2,option3,option4,correctIndex
mcq,What is 2+2?,4,3,5,6,0
mcq,What is the capital of France?,Paris,London,Berlin,Madrid,0
```

**Columns:**
- `type`: Must be "mcq"
- `prompt`: The question text
- `option1`: First option
- `option2`: Second option  
- `option3`: Third option
- `option4`: Fourth option
- `correctIndex`: Index of correct answer (0-3, where 0=first option)

### For Boolean Questions (True/False)
```
type,prompt,correctAnswer
boolean,Is the sky blue?,true
boolean,Is water wet?,true
```

**Columns:**
- `type`: Must be "boolean"
- `prompt`: The question text
- `correctAnswer`: Must be "true" or "false"

## Example CSV File
```csv
type,prompt,option1,option2,option3,option4,correctIndex
mcq,What is 2+2?,4,3,5,6,0
mcq,What is the capital of France?,Paris,London,Berlin,Madrid,0
mcq,Which planet is closest to the Sun?,Mercury,Venus,Earth,Mars,0
boolean,Is the sky blue?,true
boolean,Is water wet?,true
mcq,What is the largest mammal?,Blue Whale,Elephant,Giraffe,Polar Bear,0
mcq,How many continents are there?,7,6,8,5,0
boolean,Is the Earth flat?,false
mcq,What is the chemical symbol for gold?,Au,Ag,Fe,Cu,0
mcq,Which year did World War II end?,1945,1944,1946,1943,0
```

## How to Use

1. **Download Template**: Click "Download Template" button to get a sample CSV file
2. **Edit CSV**: Open the file in Excel, Google Sheets, or any text editor
3. **Add Questions**: Replace the example questions with your own
4. **Upload CSV**: Click "Upload CSV" button and paste your CSV data
5. **Select Module**: Choose which module to add the questions to

## Important Notes

- **First row must be headers** (column names)
- **All MCQ questions must have exactly 4 options**
- **correctIndex for MCQ must be 0, 1, 2, or 3**
- **Boolean questions only need prompt and correct answer**
- **Questions are added to existing quizzes or create new ones**
- **Existing questions in the module will be replaced**

## Troubleshooting

- **"No valid questions found"**: Check your CSV format and make sure all required columns are present
- **"Failed to upload CSV"**: Verify your CSV syntax and try again
- **Questions not showing**: Refresh the page after upload

## Tips

- Use Excel or Google Sheets for easier editing
- Test with a few questions first before adding many
- Keep question text concise and clear
- Make sure correct answers are properly marked
- Use consistent formatting throughout the file
