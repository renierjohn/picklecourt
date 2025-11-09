#!/bin/bash

# Deployment script for Pickleball Court Booking System
# Usage: ./deploy.sh [environment]
# Available environments: local, stage, prod

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default environment
ENV="local"

# Function to display usage information
show_usage() {
    echo -e "${YELLOW}Usage: $0 [environment]${NC}"
    echo -e "Available environments:"
    echo -e "  local   - Deploy locally (default)"
    echo -e "  stage   - Deploy to staging environment"
    echo -e "  prod    - Deploy to production environment"
    exit 1
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if environment argument is provided
if [ $# -gt 0 ]; then
    case "$1" in
        local|stage|prod)
            ENV="$1"
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            echo -e "${RED}Error: Unknown environment '$1'${NC}"
            show_usage
            ;;
    esac
fi

# Environment specific variables and commands
declare -A ENV_VARS
ENV_VARS=(
    [local]="VITE_APP_ENV=local"
    [stage]="VITE_APP_ENV=stage"
    [prod]="VITE_APP_ENV=production"
)

# Ensure Node.js and npm are installed
if ! command_exists node || ! command_exists npm; then
    echo -e "${RED}Error: Node.js and npm are required for deployment${NC}"
    exit 1
fi

# Install dependencies
# echo -e "${GREEN}Installing dependencies...${NC}"
# npm install

# Build the application
echo -e "\n${GREEN}Building for ${ENV} environment...${NC}"

# Set environment variables
export ${ENV_VARS[$ENV]}
nvm use 22
# Run the appropriate build command
case "$ENV" in
    local)
        echo -e "${YELLOW}Starting development server...${NC}"
        yarn build
        ;;
    stage)
        echo -e "${YELLOW}Building for staging...${NC}"
        yarn build:stage
        yarn wrangler deploy --env staging
        ;;
    prod)
        echo -e "${YELLOW}Building for production...${NC}"
        yarn build:prod
        yarn wrangler deploy --env prod
        ;;
esac

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Successfully built for ${ENV} environment!${NC}"
    
    # Additional deployment steps can be added here
    # For example, deploying to a hosting service
    
    if [ "$ENV" == "stage" ] || [ "$ENV" == "prod" ]; then
        echo -e "\n${YELLOW}Would you like to deploy to ${ENV}? (y/n)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo -e "\n${GREEN}Deploying to ${ENV}...${NC}"
            # Add your deployment commands here
            # For example:
            # firebase use $ENV
            # firebase deploy
            
            echo -e "\n${GREEN}✅ Successfully deployed to ${ENV}!${NC}"
        else
            echo -e "\n${YELLOW}Deployment cancelled.${NC}"
        fi
    fi
else
    echo -e "\n${RED}❌ Build failed. Please check the error messages above.${NC}"
    exit 1
fi

exit 0
