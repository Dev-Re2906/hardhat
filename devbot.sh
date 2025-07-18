#!/bin/bash

clear
echo "🤖 Full-Stack Development Assistant"
echo "------------------------------------"
echo "Hello! I'm your terminal assistant for building and deploying projects."
echo ""
echo "📁 Checking current directory: $(pwd)"

# Check if package.json exists
if [ -f "package.json" ]; then
  echo "✅ package.json found."
else
  echo "⚠️ package.json not found. Would you like to create a new project? (yes/no)"
  read create_project
  if [ "$create_project" = "yes" ]; then
    echo "🧰 Choose project type:"
    echo "1. Next.js"
    echo "2. Nest.js"
    echo "3. Vue.js"
    echo "4. Express.js"
    echo "5. Basic Node.js"
    read -p "Enter number: " type

    case $type in
      1)
        echo "🔧 Installing Next.js..."
        npx create-next-app@latest .
        ;;
      2)
        echo "🔧 Installing Nest.js..."
        npm i -g @nestjs/cli
        nest new .
        ;;
      3)
        echo "🔧 Installing Vue.js..."
        npm init vue@latest
        ;;
      4)
        echo "🔧 Installing Express.js..."
        npm init -y
        npm i express
        echo "const express = require('express'); const app = express(); app.get('/', (req, res) => res.send('Hello World!')); app.listen(3000);" > index.js
        ;;
      5)
        echo "🔧 Setting up basic Node.js project..."
        npm init -y
        ;;
      *)
        echo "❌ Unknown type"
        exit 1
        ;;
    esac
  else
    echo "⛔ Cannot continue without package.json"
    exit 1
  fi
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Would you like to run the project now? (yes/no)"
read run_it

if [ "$run_it" = "yes" ]; then
  if [ -f "index.js" ]; then
    echo "▶️ Running index.js with node..."
    node index.js
  else
    echo "📂 Running npm start..."
    npm start
  fi
fi

echo "✅ Done. If you want to deploy the project later, choose deployment mode next time."
