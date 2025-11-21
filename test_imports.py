#!/usr/bin/env python3
"""
Script para testar TODOS os imports do backend
"""
import sys

def test_imports():
    errors = []
    
    # Lista de todos os imports críticos encontrados no código
    imports_to_test = [
        ("fastapi", "FastAPI"),
        ("uvicorn", None),
        ("pydantic", "BaseModel"),
        ("pydantic_settings", "BaseSettings"),
        ("sqlalchemy", "create_engine"),
        ("alembic", None),
        ("psycopg", None),
        ("psycopg2", None),
        ("pgvector.sqlalchemy", "Vector"),
        ("bcrypt", None),
        ("passlib.hash", "argon2"),
        ("jwt", None),
        ("openai", "OpenAI"),
        ("dotenv", "load_dotenv"),
        ("cryptography.hazmat.primitives.ciphers.aead", "AESGCM"),
        ("tiktoken", None),
        ("pypdf", None),
        ("docx", "Document"),
        ("numpy", None),
        ("email_validator", None),
    ]
    
    print("Testando imports...")
    for module_name, attr in imports_to_test:
        try:
            if attr:
                exec(f"from {module_name} import {attr}")
                print(f"✅ {module_name}.{attr}")
            else:
                exec(f"import {module_name}")
                print(f"✅ {module_name}")
        except Exception as e:
            error_msg = f"❌ {module_name}: {str(e)}"
            print(error_msg)
            errors.append(error_msg)
    
    if errors:
        print("\n\n🚨 ERROS ENCONTRADOS:")
        for error in errors:
            print(error)
        return False
    else:
        print("\n\n🎉 TODOS OS IMPORTS FUNCIONARAM!")
        return True

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)

