import os
import json
from pymongo import MongoClient
from bson import json_util

MONGODB_URI = "mongodb+srv://silverlyek_db_user:2grWVHsqN62jsGDw@cluster0.j2dsw0.mongodb.net/?appName=Cluster0"

def backup_mongodb():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    
    # Get list of databases
    try:
        db_names = client.list_database_names()
    except Exception as e:
        print(f"Error connecting or listing databases: {e}")
        return

    print(f"Found databases: {db_names}")
    
    # Filter out system databases
    exclude_dbs = ["admin", "config", "local"]
    target_dbs = [db for db in db_names if db not in exclude_dbs]
    
    backup_dir = os.path.join(os.getcwd(), "mongodb_backup")
    os.makedirs(backup_dir, exist_ok=True)
    print(f"Backup directory: {backup_dir}")
    
    for db_name in target_dbs:
        print(f"\nBacking up database: {db_name}")
        db = client[db_name]
        
        try:
            collections = db.list_collection_names()
        except Exception as e:
            print(f"Error listing collections for database {db_name}: {e}")
            continue
            
        db_backup_dir = os.path.join(backup_dir, db_name)
        os.makedirs(db_backup_dir, exist_ok=True)
        
        for coll_name in collections:
            print(f"  Backing up collection: {coll_name}")
            coll = db[coll_name]
            
            try:
                documents = list(coll.find({}))
                print(f"    Found {len(documents)} documents.")
                
                # Write to JSON using bson.json_util to handle ObjectId, datetime, etc.
                file_path = os.path.join(db_backup_dir, f"{coll_name}.json")
                with open(file_path, "w", encoding="utf-8") as f:
                    # Using json_util.dumps to export to MongoDB Extended JSON format
                    f.write(json_util.dumps(documents, indent=2))
                print(f"    Saved to {file_path}")
            except Exception as e:
                print(f"    Error backing up collection {coll_name}: {e}")
                
    print("\nBackup process completed.")

if __name__ == "__main__":
    backup_mongodb()
