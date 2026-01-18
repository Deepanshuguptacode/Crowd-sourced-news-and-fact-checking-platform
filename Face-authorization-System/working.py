import cv2
import numpy as np
import matplotlib.pyplot as plt
from insightface.app import FaceAnalysis

# Load ArcFace model
app = FaceAnalysis(providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640,640))


def get_embedding(image_path):
    # Load image fresh every time
    img = cv2.cvtColor(cv2.imread(image_path), cv2.COLOR_BGR2RGB)

    # Detect faces with ArcFace
    faces = app.get(cv2.cvtColor(img, cv2.COLOR_RGB2BGR))

    if not faces:
        print(f"No face detected in {image_path}")
        return None

    # Take first face
    face = faces[0]
    embedding = face.normed_embedding

    # Show detected face crop
    x1, y1, x2, y2 = face.bbox.astype(int)
    crop = img[y1:y2, x1:x2]
    plt.imshow(crop)
    plt.axis("off")
    plt.title(image_path)
    plt.show()

    return embedding

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Example usage
emb1 = get_embedding("image5.jpg")   # first image
emb2 = get_embedding("my photo.jpg")   # second image

if emb1 is not None and emb2 is not None:
    sim = cosine_similarity(emb1, emb2)
    print("Similarity Score:", sim)
