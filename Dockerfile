# Use a base image with both Python and Java
FROM python:3.10-slim

# Install OpenJDK 17 and other necessary tools
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set Java home
ENV JAVA_HOME /usr/lib/jvm/java-17-openjdk-amd64
ENV PATH $JAVA_HOME/bin:$PATH

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port Flask runs on
EXPOSE 5000

# Start the application using gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
