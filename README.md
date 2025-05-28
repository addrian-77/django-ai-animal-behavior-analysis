#  Django AI Animal Behavior Analysis

A Django-based web application that leverages AI to analyze and classify cow behavior based on simulated physiological data. This tool supports proactive livestock monitoring and health diagnostics using synthetic data and machine learning.

## Features

- **Synthetic Data Generation**: Simulates cow physiological data including temperature, heart rate, hunger, tiredness, and age.
- **AI Classification**: Uses machine learning models to classify cow behavior and health status.
- **Web Interface**: Django-powered UI to view and analyze the data.
- **Clean Codebase**: Modular architecture separating simulation, model training, and web app logic.



## Prerequisites

Before setting up the project, ensure the following are installed:

- Python 3.8+
- pip (Python package manager)
- virtualenv (optional, but recommended for isolated environments)



## Installation


   ```bash
   git clone https://github.com/addrian-77/django-ai-animal-behavior-analysis.git
   cd django-ai-animal-behavior-analysis
   py manage.py collectstatic
   py manage.py runserver
