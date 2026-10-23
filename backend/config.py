from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "city_day.csv"
MODEL_DIR = BASE_DIR / "models"

# Set this to the exact target column in your CSV, for example "AQI" or "PM2.5".
# None means the training script attempts to detect a suitable target.
TARGET_COLUMN = None

TEST_SIZE = 0.2
RANDOM_STATE = 42
