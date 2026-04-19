from fastapi import HTTPException, status

class BaseAPIException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)

class DatabaseIntegrityError(BaseAPIException):
    def __init__(self, detail: str = "Database Integrity Error"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

class EntityNotFoundError(BaseAPIException):
    def __init__(self, entity: str):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=f"{entity} not found")

class AuthenticationError(BaseAPIException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)
