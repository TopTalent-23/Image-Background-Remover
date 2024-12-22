# Image Background Remover

A web application that removes backgrounds from images using a Next.js frontend and Flask backend. Upload single or multiple images and download the processed results with transparent backgrounds.

Built at [LangTrace](https://langtrace.ai) by [Karthik Kalyanaraman](https://x.com/karthikkalyan90).

This application uses the [rembg](https://pypi.org/project/rembg/) model for background removal. Rembg is an open-source tool that uses deep learning to remove image backgrounds.

## Features

- Upload multiple images simultaneously
- Real-time processing progress tracking
- Download individual processed images or all as a zip file
- Responsive design with image previews
- Processing time display for each image

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn UI Components

### Backend
- Python Flask
- rembg (Background Removal Library) - Uses U2NET model for background removal
- TensorFlow (Required by rembg)

## Prerequisites

Before running the application, make sure you have the following installed:
- Docker
- Docker Compose
- Git

## Project Structure

```
.
├── frontend/               # Next.js frontend application
│   ├── Dockerfile         # Frontend Docker configuration
│   ├── src/               # Source code
│   └── package.json       # Frontend dependencies
├── backend/               # Flask backend application
│   ├── Dockerfile        # Backend Docker configuration
│   └── app.py            # Main Flask application
└── docker-compose.yml    # Docker Compose configuration
```

## Installation & Running

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd image-background-remover
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Click on the upload area or drag and drop images
3. Wait for the background removal process to complete
4. Download individual images or use the "Download Images" button to get all processed images as a zip file

## Development

To run the application in development mode with hot reloading:

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## API Endpoints

### POST /remove-background/
Removes the background from an uploaded image.

Request:
- Content-Type: multipart/form-data
- Body: file (image file)

Response:
- Content-Type: image/png
- Body: Processed image with transparent background

## Environment Variables

Frontend:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://backend:8000)

Backend:
- `PYTHONUNBUFFERED`: Python output buffering (default: 1)

## Resource Limits

The application is configured with the following resource limits in Docker:

Frontend:
- CPU: 1 core (reserved: 0.5)
- Memory: 2GB (reserved: 1GB)

Backend:
- CPU: 2 cores (reserved: 1)
- Memory: 4GB (reserved: 2GB)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

Common issues and solutions:

1. Permission denied errors:
   ```bash
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

2. Backend not accessible:
   - Check if the backend container is running: `docker-compose ps`
   - Verify network connectivity between containers
   - Check backend logs: `docker-compose logs backend`

3. Images not processing:
   - Ensure enough system resources are available
   - Check backend logs for Python errors
   - Verify file size and format compatibility