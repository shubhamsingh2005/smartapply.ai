# smartapply.ai  
### AI-Powered Job Application Automation Platform

**Mini Project – II**

---

## 📌 Project Overview

**smartapply.ai** is an AI-powered job application automation platform designed to address inefficiencies, redundancy, and fragmentation in modern recruitment workflows. The platform treats a candidate’s professional identity as a structured, reusable, and evolving digital asset, enabling intelligent resume management, job relevance analysis, and controlled application automation.

The system aims to reduce repetitive manual effort for job seekers while improving alignment with Applicant Tracking Systems (ATS) and enhancing transparency and user control over AI-assisted processes.

---

## 🎯 Problem Statement

In today’s recruitment ecosystem, candidates are required to repeatedly enter the same career information across multiple job portals, often in inconsistent formats. This leads to:
- Application fatigue  
- Data inconsistency and fragmentation  
- Poor ATS compatibility  
- Missed opportunities for qualified candidates  

There is no unified system that manages professional identity as a centralized, reusable, and intelligent asset. **smartapply.ai** is designed to bridge this gap.

---

## 🚀 Key Features

- **Centralized Career Profile (Career ERP)**  
  A single source of truth for storing and managing professional identity data.

- **Secure Authentication & Trust Layer**  
  Email-password authentication, Google OAuth 2.0, OTP verification, and JWT-based session management.

- **AI-Based Resume & Job Description Intelligence**  
  Semantic extraction of skills, experience, and role expectations from resumes and job descriptions.

- **Job Relevance Scoring Engine**  
  Transparent and explainable scoring of candidate–job compatibility.

- **Resume & Cover Letter Generation**  
  Role-specific, ATS-optimized document generation with full user control.

- **Human-in-the-Loop Automation**  
  Controlled browser automation for job applications with explicit user oversight.

- **Observability & Ethics**  
  Audit logs, consent mechanisms, and explainable AI decisions.

---

## 🛠️ Technology Stack

- **Backend:** FastAPI (Python 3.10+), Pydantic v2  
- **Frontend:** React 19 + TypeScript, Vite  
- **Database:** PostgreSQL, SQLAlchemy 2.0, Alembic  
- **Authentication:** JWT, Google OAuth 2.0, bcrypt  
- **AI / LLM:** Google Gemini 1.5 Flash  
- **Document Processing:** PyPDF  
- **Automation:** Playwright (Human-in-the-loop)  
- **Styling:** Vanilla CSS (Flexbox & Grid)  

---

## 📂 Project Structure (High-Level)

```text
smartapply.ai/
│
├── backend/        # FastAPI backend services
├── frontend/       # React + TypeScript frontend
├── docs/           # Project documentation and reports
├── scripts/        # Automation and utility scripts
└── README.md
```


## 🧪 Project Status

- Phase 1: Authentication & Trust Layer – **Completed**
- Phase 2: Career ERP Core – **Completed**
- Phase 3: Dashboard & User Experience Control – **Completed**
- Phase 4: AI & Semantic Intelligence – **Completed**
- Phase 5: Job Relevance Scoring Engine – **Completed**
- Phase 6: Resume & Cover Letter Generation – **Completed**
- Phase 7: Human-in-the-Loop Browser Automation – **Completed**
- Phase 8: Observability, Ethics & Deployment – **Completed**

---

## 🛠️ Getting Started (Deployment)

### Using Docker (Recommended)
1. Ensure Docker and Docker Compose are installed.
2. Configure `.env` in the `backend/` directory with `GOOGLE_AI_API_KEY`.
3. Run `docker-compose up --build`.
4. Access the Frontend at `http://localhost:5173` and Backend at `http://localhost:10000`.

### Local Development
1. **Backend**: 
   - `cd backend`
   - `python -m venv venv`
   - `source venv/bin/activate` (or `.\venv\Scripts\activate`)
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload`
2. **Frontend**:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

---

## 👥 Project Team

**Mini Project – II**

- **Shubham Singh** (23BCS13877)  
- **Mansi Kaushik** (23BCS13782)  
- **Manveer Singh** (23BCS13476)  
- **Ishika Sirohi** (23BCS13658)  

---

## 🎓 Academic Supervision

**Supervised by:**  
**Praveen Kumar Saini**  
Department of Computer Science & Engineering  
**Chandigarh University**

---

## 📖 Academic Context

This project is developed as part of **Mini Project – II** under the Bachelor of Engineering (B.E.) program in Computer Science & Engineering at Chandigarh University. The project emphasizes system design, secure software architecture, AI-assisted decision support, and ethical automation practices.

---

## ⚠️ Disclaimer

This project is developed for academic and research purposes. Automation features are implemented using a human-in-the-loop model to ensure ethical use and user consent.

---

## 📬 Contact

For academic or technical inquiries, please contact the project contributors through their official university channels.
