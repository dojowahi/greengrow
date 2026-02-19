import os
import csv
from sqlmodel import Field, SQLModel, Session, create_engine, select

# Define the Store database model
class Store(SQLModel, table=True):
    id: str = Field(default=None, primary_key=True)
    name: str
    address: str
    lat: float
    lng: float

# SQLite database setup
DB_FILE = "stores.db"
# Path it inside the backend directory to be visible locally
DATABASE_URL = f"sqlite:///./{DB_FILE}"

# Engine
engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    # Drop existing tables to ensure a fresh reload from CSV on every startup
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

def seed_db_if_empty():
    with Session(engine) as session:
        # Check if stores exist
        statement = select(Store)
        results = session.exec(statement).all()
        
        if len(results) == 0:
            print("Database empty. Seeding stores from CSV...")
            csv_path = os.path.join(os.path.dirname(__file__), "Homedepot_Locations.csv")
            try:
                with open(csv_path, mode='r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for idx, row in enumerate(reader):
                        # Generate a pseudo-ID if we don't have a store number in the CSV
                        store_id = f"100{idx}"
                        
                        store = Store(
                            id=store_id,
                            name=row['Store Name'].strip(),
                            address=row['Address'].strip(),
                            lat=float(row['Latitude']),
                            lng=float(row['Longitude'])
                        )
                        session.add(store)
                session.commit()
                print("Seeding complete.")
            except FileNotFoundError:
                 print(f"Warning: {csv_path} not found. Cannot seed database.")

def get_session():
    with Session(engine) as session:
        yield session
