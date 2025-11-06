"# SWE30003_Assignment_03" 

Setup -

Step 1:
Download the repository

Step 2:
Download and install Node.js

Step 3:
Open the repository in VSCode, or preferred editor (or simply extract repo and cd/ into with CMD.)

Step 4:
Change directory via CMD into Assignment_03.

Step 5:
In the terminal, run this set of commands.

Terminal 1:
 1. npm install
 2. json-server --watch db.json

Terminal 2:
 3. npm run dev

Step 6:
Ctrl-click the "http://localhost." link to view the website.

User Activities -

Browsing:
 1. Click on the shop tab in the header to browse the available products in the catalogue.

Registering and Logging In:
 1. Go to either Login or Profile tab (if logged out)
 2. If there's no existing account, register a customer account to save contact and shipping details.
 3. To perform Admin actions, register as an Admin account, then log in with the details you provided. Otherwise, do so with a customer account.
 4. Details will be saved as plaintext to json db for demo purposes, and you can now view your profile, details, and orders on the profile page.

Updating Your Profile:
 1. Ensure the local database API is running (see Step 5.2: `json-server --watch db.json`).
 2. Open the Profile page while logged in.
 3. In "Update contact details", edit your phone and, for customers, your delivery address, then click Save changes.
 4. In "Change password", enter your current password, a new password (min 6 chars), and confirm it, then click Update password.
 5. Changes are written to the json-server database and reflected in your session immediately.

Shopping:
 1. After logging in (or as a guest), go to the Shop tab and browse. You can add the items you want to the cart, either one at a time or in quantity.
 2. Once you've chosen your items, go the the Cart page, and finalise your order to go the Checkout.
 3. Fill you remaining details and complete your order. It will be saved as a Pending order.
 4. Go to your profile, view your order and proceed to Payment.

Administrative Actions:
 1. While in an admin account, go to the Admin dashboard.
 2. View the available options: Product Managament, User Management and Order Management.
 3. Admins can delete users and orders (however invoices will remain in the database for records). They can also add new products, or remove them from stock. SKU will always autoincrement when creating, and won't be reused.

