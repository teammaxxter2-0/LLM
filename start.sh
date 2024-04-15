#!/bin/sh
FILE = .env
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    touch .env
    # You can add default content to .env if needed
	echo "# GPT Model" > .env
    echo "MODEL=gpt-4-turbo-preview" >> .env
	echo "" >> .env
	echo "# OpenAI's API Key" >> .env
	echo "OPENAI_API_KEY=sk-insertkeyhere" >> .env
	echo "" >> .env
	echo "# Default host location" >> .env
	echo "APP_HOST=0.0.0.0" >> .env
	echo "" >> .env
	echo "# Default port" >> .env
	echo "APP_PORT=8000" >> .env
	echo "" >> .env
	echo "# Maximum tokens bot is allowed to read" >> .env
	echo "LLM_MAX_TOKENS=4000" >> .env
	
    echo ".env file created."
else
    echo ".env found."
fi
pip install -r requirements.txt
python -m uvicorn main:app --reload