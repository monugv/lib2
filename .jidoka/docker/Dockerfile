FROM maven:3.5-jdk-8

# Install node & npm
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && apt-get install -y build-essential

RUN npm install npm

# Install npm-cli-login for logging into the spectrum registry
RUN npm install -g npm-cli-login

# Install sonar-scanner
RUN wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.2.0.1873-linux.zip \
    && unzip sonar-scanner-cli-4.2.0.1873-linux.zip \
    && mv sonar-scanner-4.2.0.1873-linux /opt/sonar-scanner
ENV PATH="${PATH}:/opt/sonar-scanner/bin"

RUN mkdir /apps && chmod 777 /apps
RUN mkdir /.npm && chmod 777 /.npm