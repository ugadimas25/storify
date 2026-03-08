
# AI Agent: PDF → Chapter → Summary → Audiobook

## Overview

Project ini membuat **AI pipeline untuk mengubah buku PDF menjadi audiobook berbasis ringkasan tiap bab**.

Pipeline melakukan proses berikut:

1. Extract text dari PDF
2. Membagi text menjadi per bab
3. Membuat summary tiap bab menggunakan LLM (Claude Opus)
4. Mengubah summary menjadi audio menggunakan Google Cloud TTS

Output:

- JSON berisi chapter dan summary
- MP3 audio untuk tiap chapter
- Optional: audiobook gabungan

---

# Architecture

PDF  
↓  
PDF Text Extractor  
↓  
Chapter Splitter  
↓  
LLM Summarizer 
↓  
Google Cloud Text To Speech  
↓  
Audio Chapters (MP3)  
↓  
Audiobook

---

# Tech Stack

### Language
Python 3.10+

### TTS
Google Cloud Text-to-Speech

### Libraries
- pdfminer.six
- pydantic
- anthropic
- google-cloud-texttospeech
- python-dotenv
- tqdm

Optional:
- langchain
- crewai

---

# Project Structure

ai-audiobook-agent/

src/
│
├── extractor/
│   └── pdf_to_text.py
│
├── parser/
│   └── chapter_splitter.py
│
├── summarizer/
│   └── chapter_summary.py
│
├── tts/
│   └── google_tts.py
│
├── pipeline/
│   └── audiobook_pipeline.py
│
├── models/
│   └── chapter.py
│
└── utils/
    └── text_cleaner.py

data/
   input_pdf/
   chapters/
   summaries/
   audio/

.env  
requirements.txt  
README.md  

---

# Installation

Install dependencies:

pip install -r requirements.txt

requirements.txt

pdfminer.six  
anthropic  
google-cloud-texttospeech  
python-dotenv  
pydantic  
tqdm  

---

# Environment Variables

ANTHROPIC_API_KEY=your_key  
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account.json  

---

# Step 1: Extract PDF to Text

File:
src/extractor/pdf_to_text.py

Function:
Convert PDF menjadi raw text.

Expected Output:
string full_text

Pseudo flow:
- load pdf
- extract text
- clean whitespace
- return text

---

# Step 2: Split Text into Chapters

File:
src/parser/chapter_splitter.py

Split berdasarkan pola:

BAB 1  
BAB 2  
BAB 3  

atau

CHAPTER 1

Example output:

[
  {
    "chapter": 1,
    "title": "Judul Bab",
    "content": "text..."
  }
]

Regex contoh:

BAB\s+\d+

---

# Step 3: Chapter Summary

File:
src/summarizer/chapter_summary.py

Prompt template:

You are an expert book summarizer.

Summarize the following chapter.

Rules:
- Max 1500 characters
- Keep the key ideas
- Maintain narrative style
- Indonesian language

Chapter:
{chapter_text}

Expected Output:

{
 "chapter":1,
 "summary":"..."
}

---

# Step 4: Generate Voice with Google TTS

File:
src/tts/google_tts.py

Input:
summary text

Output:
chapter_1.mp3

Example voice config:

language_code = "id-ID"  
voice_name = "id-ID-Wavenet-D"

Optional SSML:

<speak>
{summary}
</speak>

---

# Step 5: Pipeline

File:
src/pipeline/audiobook_pipeline.py

Flow:

1. load pdf
2. extract text
3. split chapters
4. summarize chapter
5. generate audio
6. save mp3

Pseudo flow:

pdf → text → chapters → summary → tts

---

# Example Output

data/

chapters/
chapter_1.txt
chapter_2.txt

summaries/
chapter_1.json
chapter_2.json

audio/
chapter_1.mp3
chapter_2.mp3

---

# Optional Improvements

## Parallel Processing

Gunakan ThreadPoolExecutor untuk summary tiap bab.

## Long Chapter Chunking

Jika chapter terlalu panjang:

chunk → summarize → merge summary

## SSML Enhancement

<speak>
{summary}
<break time="1s"/>
</speak>

## Audiobook Merge

Gunakan ffmpeg:

ffmpeg -f concat -i list.txt -c copy audiobook.mp3

---

# Optional n8n Integration

n8n  
↓  
POST /process_pdf  
↓  
python pipeline  
↓  
return audio

---

# CLI Example

python src/pipeline/audiobook_pipeline.py --input data/input_pdf/book.pdf

---

# Future AI Agents

Extractor Agent  
↓  
Parser Agent  
↓  
Summarizer Agent  
↓  
Narrator Agent  
↓  
Publisher Agent  

Tools:
CrewAI  
LangGraph  
AutoGen  

---

# Notes

Pipeline ini cocok untuk:

- membuat audiobook otomatis
- membuat podcast dari buku
- knowledge summarization
- ebook to audio
