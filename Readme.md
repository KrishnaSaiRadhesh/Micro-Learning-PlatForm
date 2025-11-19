# High-Level Design (HLD): Micro-Learning Backend

## 1. Overview
The Micro-Learning Backend is a RESTful API built with Node.js and Express.js, using MongoDB for data persistence. It enables users to register/login, browse/enroll in short learning modules, and allows admins to manage content with analytics. The design prioritizes security (JWT auth, bcrypt), scalability (pagination/filtering), and maintainability (layered architecture with service/repo patterns).

**Key Goals**:
   - Support core features: User auth, module CRUD, enrollment, admin views.
   - Handle growth: Pagination for module lists, role-based access.
   - Tech Stack: Express (routing), Mongoose (ORM), JWT (auth), Joi (validation).

**Assumptions**:
   - Stateless API (JWT for sessions).
   - Single MongoDB instance (scale with sharding later).
   - No frontend—pure backend.

## 2. System Architecture
### 2.1 Components
   - **Client Layer**: External (e.g., mobile/web app) sends HTTP requests.
   - **API Layer**: Express server handles routing, middleware (auth/validation), controllers.
   - **Business Layer**: Services (logic/rules), Repositories (DB access).
   - **Data Layer**: MongoDB with schemas (User, Module).
   - **External**: JWT for tokens, Bcrypt for hashing.

### 2.2 Layered Architecture Diagram (Text-Based)
   ## [Client (Postman/Frontend)]
   ## ↓ HTTP Requests (GET/POST/etc.)
   ## [Express Server (server.js)]
   ## ├── Middleware (auth.js, role.js, validation.js) → Security/Checks
   ## ├── Routes (auth.js, modules.js) → Endpoint Mapping
   ## └── Controllers (authController.js, moduleController.js) → Request Handling
   ## ↓ Calls
   ## [Services (authService.js, moduleService.js)] → Business Logic (e.g., permission checks)
   ## ↓ Calls
   ## [Repositories (userRepository.js, moduleRepository.js)] → DB Operations
   ## ↓ Queries
   ## [MongoDB] → Collections: users, modules
   ## └── Indexes: email (unique), category (for filtering)



### 2.3 Data Flow Example: User Enrolls in Module
   1. Client: POST /api/modules/:id/enroll (with JWT header).
   2. Routes: Match endpoint → Run auth middleware (verify JWT → req.user).
   3. Controller: Extract id/userId → Call moduleService.enrollInModule(id, userId).
   4. Service: Validate (module exists?) → Call moduleRepo.enrollUser(id, userId).
   5. Repo: Update DB ($addToSet enrolledUsers) → Return updated module.
   6. Controller: Respond 200 JSON.
   7. Error Path: Any failure → Global errorHandler (500).

## 3. Key Design Decisions
### 3.1 Authentication
   - **JWT**: Stateless tokens (payload: {id, role}), expires 7d. Signed with .env secret.
   - **Roles**: Enum ['user', 'admin']—middleware enforces (e.g., admin for CRUD).
   - **Password**: Bcrypt hash (salt 12) via model pre-save hook.

### 3.2 Data Modeling
   - **User Schema**: email (unique), password (hashed), role.
   - **Module Schema**: title/desc/category/time (required), createdBy/enrolledUsers (refs to User).
   - **Relationships**: One-to-Many (User creates many Modules; Module has many Users enrolled). Use populate for joins.

### 3.3 API Endpoints
| Method | Endpoint                  | Auth | Role   | Description                  |
|--------|---------------------------|------|--------|------------------------------|
| POST   | /api/auth/register        | No   | -      | Create user                  |
| POST   | /api/auth/login           | No   | -      | Login, return JWT            |
| GET    | /api/modules              | No   | -      | List all (paginated/filtered)|
| GET    | /api/modules/enrolled     | Yes  | User   | User's enrolled modules      |
| POST   | /api/modules/:id/enroll   | Yes  | User   | Enroll user                  |
| POST   | /api/modules              | Yes  | Admin  | Create module                |
| GET    | /api/modules/:id          | Yes  | -      | Single module                |
| PUT    | /api/modules/:id          | Yes  | Admin  | Update module                |
| DELETE | /api/modules/:id          | Yes  | Admin  | Delete module                |
| GET    | /api/modules/:id/enrollments | Yes | Admin | Enrollment count             |

- **Pagination**: Query params ?page=1&limit=10 (repo handles skip/limit).
- **Filtering**: ?category=tech (repo query).

### 3.4 Non-Functional Requirements
   - **Security**: Helmet (headers), CORS, input validation (Joi), rate-limiting (future).
   - **Performance**: Indexes on email/category; populate only needed fields.
   - **Scalability**: Horizontal (add servers); cache popular modules (Redis future).
   - **Error Handling**: Try-catch in controllers; global util for 500s.
   - **Config**: .env for env-based (dev/prod) setups.
   - **Testing**: Postman collection for E2E; Jest for units (future).

## 4. Deployment & Monitoring
   - **Deploy**: Heroku/Vercel (env vars for secrets).
   - **CI/CD**: GitHub Actions (lint/test/deploy).
   - **Monitoring**: Winston logger; MongoDB Atlas for alerts.

## 5. Risks & Mitigations
   - **Risk**: Token theft → Mitigation: Short expiry, HTTPS.
   - **Risk**: DB overload → Mitigation: Pagination, indexes.
   - **Future**: Add progress tracking per module.






# Low-Level Design (LLD): Micro-Learning Backend

## 1. Overview
This LLD details the implementation of each component, including schemas, methods, error flows, and code snippets. It builds on the HLD, focusing on "how" to build (e.g., exact functions, params).

## 2. Database Schemas (Mongoose Models)
### 2.1 User Model (src/models/User.js)
   - **Fields**:
     - `email`: String, required, unique (index).
     - `password`: String, required (hashed).
     - `role`: String, enum ['user','admin'], default 'user'.
     - Timestamps: Auto (createdAt/updatedAt).
   - **Methods/Hooks**:
     - Pre-save: `bcrypt.hash(password, 12)` if modified.
     - Instance: `comparePassword(candidate)` → Returns boolean.
   - **Snippet**:
     ```js
     userSchema.pre('save', async function(next) {
       if (!this.isModified('password')) return next();
       this.password = await bcrypt.hash(this.password, 12);
       next();
     });
- **Indexes**: { email: 1 } (unique).

### 2.2 Module Model (src/models/Module.js)
   - **Fields**:
      - title/description/category: String, required.
      - estimatedTime: Number, required (>0).
      - createdBy: ObjectId, ref 'User', required.
      - enrolledUsers: [ObjectId], ref 'User' (array).
      - Timestamps: Auto.
   
   - **Indexes** : { category: 1 } (filtering), { enrolledUsers: 1 } (queries).
   - **Snippet** : No custom methods—use populate in repo.

## 3. Repository Layer (Data Access)
### 3.1 UserRepository (src/repositories/userRepository.js)
   - **Methods** :
      - create(userData): User.create() → Returns saved user.
      - findByEmail(email): User.findOne({email}) → Returns user or null.
   
   - **Error Handling**: Mongoose throws on validation fail (e.g., duplicate email).

## 3.2 ModuleRepository (src/repositories/moduleRepository.js)
   - **Methods** :
   - **findAll(options)** : Module.find(query).populate(...).limit(skip).sort().
   - **Params** : options {page, limit, category}.
   - **findById(id)** : Module.findById(id).populate().
   - **create(data)** : Module.create(data).
   - **update(id, data)** : Module.findByIdAndUpdate(id, data, {new: true}).populate().
   - **delete(id)** : Module.findByIdAndDelete(id).
   - **enrollUser(moduleId, userId)** : findByIdAndUpdate({$addToSet: {enrolledUsers: userId}}).
   - **getEnrollments(id)** : FindById(id).enrolledUsers.length.
   - **Snippet (Pagination)**:JavaScript.skip((page - 1) * limit).limit(limit)

## 4. Service Layer (Business Logic)
### 4.1 AuthService (src/services/authService.js)
   - **Methods** :
   - **register(email, password)** : Check exists → Create via repo → Return user (no token).
   - **login(email, password)** : Find user → Compare pass → JWT.sign({id, role}) → Return {user, token}.
   - **Errors** : Throw 'User already exists' or 'Invalid credentials' (400 in controller).
   - **Snippet (JWT)** : jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

### 4.2 ModuleService (src/services/moduleService.js)
   - **Methods** :
      - **createModule(data, userId)** : data.createdBy = userId → Repo create.
      - **getAllModules(options)** : Repo findAll(options).
      - **getModuleById(id)** : Repo findById → Throw if null.
      - **updateModule(id, data, userId)** : Get module → Check (owner or admin) → Repo update.
      - **deleteModule(id, userId)** : Similar check → Repo delete.
      - **enrollInModule(id, userId)** : Repo enrollUser.
      - **getEnrolledModules(userId)** : Repo findAll({enrolledUsers: userId}).
      - **getEnrollmentCount(id)** : Repo getEnrollments.
   
    - **Errors**: 'Module not found', 'Not authorized' (403 in middleware + service).

## 5. Middleware Implementation
   - **auth.js** : Extract Bearer token → jwt.verify → req.user = decoded → next() or 401.
   - **role.js** : Factory: (roles) => (req, res, next) => { if (!roles.includes(req.user.role)) 403; next(); }.
   - **validation.js** : Joi schemas per endpoint (e.g., register: email.required().min(6) for pass) → Validate body or 400.

## 6. Controllers (Request/Response Handlers)
   - **authController.js** : Try { service.call() } catch { res.status(400).json({msg: error.message}) }.
   - **moduleController.js** : Similar; for GET all: Extract query → Service → res.json({modules, page, limit}).
   - **Error Flow** : Uncaught → utils/errorHandler (log stack, res 500).

## 7. Routes Configuration
   - **auth.js** : POST /register (validate → controller), POST /login (validate → controller).
   - **modules.js** :
           GET / (public).
           router.use(auth) → All below protected.
           GET /enrolled (user).
           POST /:id/enroll (user).
           POST / (role(['admin']) + validate → create).
           GET /:id, PUT /:id, DELETE /:id (admin role).
           GET /:id/enrollments (admin).
   

## 8. Utils
   - **errorHandler.js** : Global: console.error(err.stack); res.status(500).json({msg: 'Something went wrong!'}); (prod: hide stack).

## 9. Environment & Config
   - **.env** : PORT, MONGO_URI, JWT_SECRET, NODE_ENV.
   - **database.js** : mongoose.connect(MONGO_URI) → Log success/error.

## 10. Testing & Validation
   - **Unit** : Jest for services/repos (mock DB).
   - **E2E** : Postman collection (included in repo).
   - **Validation** : Joi for inputs; Mongoose for schemas.