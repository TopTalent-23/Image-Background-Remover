import asyncio
import io
import os
import tempfile
from typing import List

import uvicorn
from fastapi import BackgroundTasks, FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
from rembg import remove

app = FastAPI(title="Background Removal API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

SEMAPHORE = asyncio.Semaphore(3)


def cleanup_files(files: List[str]) -> None:
    for file in files:
        try:
            if os.path.exists(file):
                os.unlink(file)
        except Exception:
            pass


async def process_single_image(input_image: Image.Image) -> str:
    temp_output = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    try:
        output = remove(input_image)
        output.save(temp_output.name, format='PNG', optimize=True)
        return temp_output.name
    except Exception as e:
        cleanup_files([temp_output.name])
        raise e


@app.post("/remove-background")
async def remove_background_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    if not file.content_type or not file.content_type.startswith('image/'):
        raise ValueError("File must be an image")

    try:
        contents = await file.read()
        input_image = Image.open(io.BytesIO(contents))

        if input_image.mode not in ('RGB', 'RGBA'):
            input_image = input_image.convert('RGB')

        output_path = await process_single_image(input_image)
        background_tasks.add_task(cleanup_files, [output_path])

        return FileResponse(
            path=output_path,
            media_type="image/png",
            filename=f"processed_{file.filename}"
        )

    except Exception as e:
        raise Exception(f"Error processing image: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
