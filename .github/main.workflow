name: Publish Docker image to GitHub Package Registry
on:
  push:
    branches:    
      - master
jobs:
  build:
    runs-on: ubuntu-latest 
    steps:
    - name: Copy Repo Files
      uses: actions/checkout@master

    - name: Publish Docker Image to GPR
      uses: machine-learning-apps/gpr-docker-publish@master
      id: docker
      with:
        USERNAME: ${{ secrets.DOCKER_USERNAME }}
        PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
        IMAGE_NAME: 'shareimage'
        DOCKERFILE_PATH: 'Dockerfile'
        BUILD_CONTEXT: '.'
