# Assignment 3 Implementation Cheat Sheet

## 🎯 Core Objectives

### Implementation Requirements
- ✅ Implement at least **4 business areas** fully functional
- ✅ Use **Object-Oriented language** of choice
- ✅ Apply a **professional coding standard** (document reference)
- ✅ Simple UI (graphical or textual) - prioritize usability
- ✅ Use **files for persistent storage** (databases optional)
- ✅ **NO payment processing** - simple confirmation message only
- ✅ Provide executable + source code

### Documentation Requirements
- ✅ **Detailed design changes** with justifications
- ✅ **Quality reflection** on Assignment 2 design
- ✅ **Lessons learned** from implementation
- ✅ **Architecture style(s)** identification and discussion
- ✅ Include **Assignment 2 as appendix**

---

## 📝 Logbook Categories (Document Everything!)

### 1. Design Changes - Class Level
```markdown
**Change:** [What changed in class structure]
**Original Design:** [From Assignment 2]
**New Design:** [Current implementation]
**Justification:** [Why this change was necessary]
**Impact:** [What other classes/interactions affected]
```

### 2. Design Changes - Responsibility Level
```markdown
**Class:** [Class name]
**Responsibility Changed:** [Specific responsibility]
**Reason:** [Why original was inadequate/incorrect/ambiguous]
**New Approach:** [How it's now handled]
**Collaborators Affected:** [List]
```

### 3. Design Changes - Bootstrap/Interactions
```markdown
**Scenario:** [Which use case]
**Original Sequence:** [From Assignment 2 diagrams]
**Modified Sequence:** [Current implementation]
**Justification:** [Why sequence changed]
**Patterns Applied:** [Any new patterns introduced]
```

### 4. Implementation Notes
```markdown
**File:** [Class/module name]
**Decision:** [Technical decision made]
**Alternatives Considered:** [What else you thought about]
**Rationale:** [Why this approach chosen]
**Technical Debt:** [Any shortcuts/TODOs]
```

---

## 🏗️ Architecture Documentation

### Identify Your Architecture Style(s)
From Assignment 2: **Layered Architecture (3-tier)**

**Required Discussion Points:**
1. **Components** (higher level than classes)
   - Presentation Layer (UI components)
   - Business Logic Layer (domain classes)
   - Data Access Layer (persistence)

2. **Connections**
   - How layers communicate
   - Interface definitions
   - Data flow patterns

3. **Constraints**
   - Layer dependencies (only downward)
   - No direct database access from UI
   - Business logic independence

---

## ✅ 4 Business Areas to Implement

### Recommended Areas (Consider Dependencies)
1. **Customer Account Management** (Task 1)
   - Registration, login, profile updates
   - Classes: User, Customer, AuthenticationService

2. **Product Catalogue Browsing** (Task 2)
   - Browse, search, filter products
   - Classes: Product, ProductCatalogue

3. **Shopping Cart Management** (Task 3)
   - Add/remove items, update quantities, checkout
   - Classes: ShoppingCart, Customer, ProductCatalogue

4. **Order Processing** (Tasks 4-5 combined)
   - Create order, generate invoice, payment confirmation (simulated)
   - Classes: Order, Invoice, Payment

**Justification for Selection:**
- Covers complete customer journey
- Manageable dependencies
- Demonstrates all key patterns from Assignment 2
- Meets usability requirements from Assignment 1

---

## 🎨 Coding Standards

### Choose ONE Standard (Document It!)
- **Google Style Guides** (Java/Python/JavaScript)
- **PEP 8** (Python)
- **Oracle Code Conventions** (Java)
- **Airbnb Style Guide** (JavaScript)

**Document:** Reference URL + key conventions followed

### Consistent Naming (From Assignment 2)
- **Classes:** PascalCase (`ProductCatalogue`, `ShoppingCart`)
- **Methods:** camelCase (`addToCart()`, `processPayment()`)
- **Variables:** camelCase (`productID`, `totalAmount`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_CART_ITEMS`)

---

## 💾 Persistent Storage Strategy

### File-Based Storage (Recommended)
```markdown
**Format:** JSON or CSV
**Files Needed:**
- customers.json
- products.json
- orders.json
- shopping_carts.json
- invoices.json

**Storage Operations:**
- Load on startup
- Save on modification
- Auto-backup mechanism
```

### Critical Data Requirements
- **Customer:** Hash passwords (use built-in libraries)
- **Product:** Track stock levels
- **Order:** Immutable after creation
- **Cart:** Session-based + persistent for registered users

---

## 🧪 Demonstration Scenarios

### Required Scenario Evidence
For each scenario, capture:
1. ✅ Empty UI at start
2. ✅ Correct input examples
3. ✅ Input validation (show invalid input handling)
4. ✅ Change/deletion of data
5. ✅ Successful completion

### Recommended Scenarios
1. **New Customer Journey**
   - Register → Browse → Add to Cart → Checkout → Payment Confirmation

2. **Returning Customer**
   - Login → Persistent Cart → Modify Cart → Complete Order

3. **Error Handling**
   - Invalid registration data
   - Out-of-stock item
   - Invalid payment details (simulated)

4. **Admin Functions** (if implementing)
   - Add/update product
   - View orders
   - Generate reports (if in scope)

---

## 🤔 Reflection Questions (Answer Throughout)

### Adequacy Questions
- ✅ What worked well from Assignment 2?
- ✅ Which classes needed minimal changes?
- ✅ Which design patterns proved useful?

### Missing Aspects
- ❌ What wasn't specified in Assignment 2?
- ❌ What hidden dependencies discovered?
- ❌ What data structures needed?

### Errors Introduced
- ⚠️ Incorrect associations?
- ⚠️ Missing responsibilities?
- ⚠️ Wrong multiplicity?

### Ambiguities
- ❓ What required interpretation?
- ❓ Where were specs unclear?
- ❓ What assumptions made?

### Design Evolution
- 🔄 How did you fix issues?
- 🔄 What refactoring occurred?
- 🔄 What patterns added/changed?

### Lessons Learned
- 💡 What would you do differently in high-level design?
- 💡 What level of detail needed earlier?
- 💡 What worked well in your process?

---

## 📋 Submission Checklist

### Part 1: Code Package (ZIP/RAR)
- [ ] All source code files
- [ ] Executable (JAR/EXE/etc.)
- [ ] README with run instructions
- [ ] Data files (initial/sample)
- [ ] Coding standard reference document

### Part 2: PDF Document
- [ ] **Section 1:** Final detailed class diagram
- [ ] **Section 2:** Design changes documentation
  - [ ] Class-level changes + justifications
  - [ ] Responsibility-level changes + justifications
  - [ ] Bootstrap/interaction changes + justifications
- [ ] **Section 3:** Quality reflection on Assignment 2
- [ ] **Section 4:** Lessons learned
- [ ] **Section 5:** Architecture style discussion
- [ ] **Section 6:** Implementation evidence (screenshots/video)
- [ ] **Section 7:** Platform/deployment instructions
- [ ] **Appendix:** Complete Assignment 2 submission

### Part 3: Declaration Forms
- [ ] Signed cover sheet
- [ ] Contribution document with time logs
- [ ] Group collaboration evidence

---

## ⚠️ Zero Marks Scenarios (AVOID!)

1. ❌ No implementation / obviously incomplete
2. ❌ Significantly incorrect implementation
3. ❌ Missing Assignment 2 in appendix
4. ❌ Changes not justified/documented

---

## 🎯 Quick Implementation Tips

### Start Simple
1. Implement core classes first (User, Customer, Product)
2. Add persistence layer
3. Build basic UI
4. Test happy path
5. Add validation/error handling
6. Refine based on testing

### Design Patterns from Assignment 2
- ✅ **Singleton:** AuthenticationService, ProductCatalogue
- ✅ **Factory Method:** User creation (Customer/Admin)
- ✅ **Strategy:** Payment methods (future - document why simplified)
- ✅ **Template Method:** User authentication workflow
- ✅ **Façade:** ReportGenerator (if implementing)
- ✅ **MVC:** UI separation

### Critical Validations (From Assignment 1)
- Email format validation
- Password complexity (8+ chars, mixed case, numbers)
- Stock availability checks
- No negative quantities
- Proper GST calculations (10%)
- Address format validation

---

## 📊 Mark Allocation Reference

| Component | Points | Priority |
|-----------|--------|----------|
| Detailed OO Design + Justifications | 30 | HIGH |
| Quality Discussion (Assignment 2) | 20 | HIGH |
| Lessons Learned | 10 | MEDIUM |
| Architecture Style Discussion | 10 | MEDIUM |
| Source Code + Standard | 20 | HIGH |
| Compilation Evidence | 5 | MEDIUM |
| Execution Evidence | 25 | HIGH |
| **TOTAL** | **120** | |

---

## 🔑 Key Success Factors

1. **Document as you code** - Don't leave logbook to the end
2. **Justify every change** - "Because it didn't work" isn't enough
3. **Evidence everything** - Screenshots/video of working system
4. **Include Assignment 2** - In appendix, exactly as submitted
5. **Follow a standard** - Pick one, document it, stick to it
6. **Test thoroughly** - Show both success and error cases
7. **Clear instructions** - Anyone should be able to run your code

---

## 💡 Pro Tips

- Keep a **daily log** of decisions and changes
- Take **screenshots** as you build features
- **Version control** your code (Git) for change tracking
- **Test each class** independently before integration
- **Peer review** design decisions within group
- **Time box** features - don't over-engineer

---

## 📅 Implementation Timeline Suggestion

### Week 1: Foundation
- Set up project structure
- Implement core domain classes (User, Customer, Product)
- Create file-based persistence layer
- Begin logbook

### Week 2: Core Features
- Implement AuthenticationService
- Build ProductCatalogue
- Create ShoppingCart functionality
- Continue documenting changes

### Week 3: Integration & UI
- Implement Order/Invoice/Payment
- Build basic UI
- Integrate all components
- Test scenarios

### Week 4: Polish & Documentation
- Refine UI/UX
- Complete all validations
- Capture evidence (screenshots/video)
- Finalize documentation
- Prepare submission package

---

## 🔍 Common Pitfalls to Avoid

1. **Over-engineering** - Keep it simple, functional over fancy
2. **Late documentation** - Document changes as you make them
3. **Incomplete justifications** - Every change needs a solid reason
4. **Missing evidence** - Screenshots for EVERY scenario
5. **Unclear instructions** - Test your README on a fresh machine
6. **Ignoring Assignment 2** - It's your baseline, reference it constantly
7. **Poor time management** - Start early, iterate often

---

## 📞 When to Seek Clarification

Post to Assignment 3 discussion forum on Canvas for:
- Ambiguities in requirements
- Scope questions
- Technical constraints
- Submission format questions

**Do NOT email** unless it's personal/confidential.

---

**Remember:** This is about demonstrating understanding of OO design principles through implementation, not building a production-ready system. Focus on clean code, clear documentation, and thoughtful reflection!

---

## 📚 Quick Reference Links

### From Assignment 2
- **CRC Cards:** Section 3.3 (pages 10-14)
- **UML Diagram:** Section 3.2 (page 10)
- **Design Patterns:** Section 5 (pages 17-18)
- **Bootstrap Process:** Section 6 (pages 18-19)
- **Verification Scenarios:** Section 7 (pages 20-23)

### From Assignment 1
- **Tasks Overview:** Section 3.4 (page 6)
- **Functional Requirements:** Section 4 (pages 8-14)
- **Quality Attributes:** Section 7 (pages 21-23)
- **Data Model:** Section 5 (page 7)

---

**Last Updated:** [Current Date]
**Team:** Seth Kalantzis, Kaine Price, Luke Magnuson, Raida Zabin
**Unit:** SWE30003 - Software Architectures and Design