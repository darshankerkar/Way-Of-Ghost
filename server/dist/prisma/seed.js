import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    // ── Admin user ──
    const email = process.env.ADMIN_EMAIL ?? "admin@gdg.local";
    const password = process.env.ADMIN_PASSWORD ?? "Admin@123";
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
        where: { email },
        update: { password: hash, role: "ADMIN", status: "APPROVED" },
        create: {
            email,
            password: hash,
            name: "Event Admin",
            college: "GDG Spectrum",
            role: "ADMIN",
            status: "APPROVED",
        },
    });
    // ── Event state ──
    await prisma.eventState.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton", currentRound: 0 },
    });
    // Keep seed deterministic across repeated runs.
    await prisma.$transaction([
        prisma.submission.deleteMany({}),
        prisma.matchup.deleteMany({}),
        prisma.proctoringStatus.deleteMany({}),
        prisma.problem.deleteMany({}),
    ]);
    // ── Round 1: Algorithmic Coding Problems (Java) ──
    const p1 = await prisma.problem.create({
        data: {
            title: "Smart Campus Entry Tracker",
            description: `Greenwood University has installed an IoT-based infrared scanner at the entrance of the "Great Hall" for a career fair. Every time a student passes through the gate, their RFID tag is scanned.

The system logs two types of events:
• Entry (+ ID): The student enters the hall.
• Exit (- ID): The student leaves the hall.

The Issue: The Security Department has noticed that some students are "tailgating" (slipping through the door behind someone else). This causes a logic error where the system records a student leaving the hall who was never recorded entering.

Input Format:
- First line: N (Number of logs)
- Next N lines: + ID or - ID

Output Format:
- Final count of students inside, or "INVALID" if any exit has no matching entry.`,
            difficulty: "Easy",
            roundNumber: 2,
            hint: "Track currently present IDs using a HashSet. If an exit occurs for an ID not in the set, it's invalid.",
            starterCode: JSON.stringify({
                java: `import java.util.*;

public class EventTracker {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
                python: `def solve():
    # Your code here
    pass

if __name__ == '__main__':
    solve()`,
                "c++": `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`
            }),
            timeLimit: 900,
            testCases: {
                create: [
                    { input: "5\n+ 1\n+ 2\n- 1\n+ 3\n- 2", expected: "1", isHidden: false },
                    { input: "4\n+ 10\n+ 20\n- 10\n- 20", expected: "0", isHidden: false },
                    { input: "3\n+ 1\n- 2\n- 1", expected: "INVALID", isHidden: true },
                ],
            },
        },
    });
    const p2 = await prisma.problem.create({
        data: {
            title: "Freelance Project Optimizer",
            description: `You are a freelance software developer with a list of N pending contracts. Each contract has a specific Time Requirement (days to complete) and a Strict Deadline (the day it must be submitted).

You work sequentially; you can only work on one project at a time. You cannot submit a project even one minute past its deadline. Your goal is to maximize your portfolio by completing the highest number of tasks possible.

Input Format:
- First line: N
- Next N lines: duration deadline

Output Format:
- Maximum tasks completed.`,
            difficulty: "Medium",
            roundNumber: 2,
            hint: "Sort tasks by deadline. Iterate and maintain a Max-Heap of durations. Accept tasks if they fit; if not, swap against a longer accepted task to save time.",
            starterCode: {
                java: `import java.util.*;

public class PortfolioManager {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
                python: `def solve():
    # Your code here
    pass

if __name__ == '__main__':
    solve()`,
                "c++": `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`
            },
            timeLimit: 900,
            testCases: {
                create: [
                    { input: "3\n2 5\n1 3\n2 7", expected: "3", isHidden: false },
                    { input: "3\n3 3\n2 3\n1 3", expected: "1", isHidden: false },
                    { input: "4\n2 2\n1 2\n2 3\n1 3", expected: "2", isHidden: true },
                ],
            },
        },
    });
    const p3 = await prisma.problem.create({
        data: {
            title: "Flash-Chat Anti-Spam Filter",
            description: `A messaging app, "Flash-Chat," prevents bot attacks by enforcing a Cooldown Rule (K). If a message is sent at time T, the system blocks any further messages from that user until at least K seconds have passed.

Critical Rule: Only successfully sent messages reset the cooldown timer. If a message is blocked, the "last successful time" remains the same.

Input Format:
- First line: N (Total messages) and K (Cooldown)
- Second line: N space-separated timestamps.

Output Format:
- Total number of blocked messages.`,
            difficulty: "Medium",
            roundNumber: 2,
            hint: "Use a map to store the 'last successful time' for each user. Only update it if the current message is sent (i.e., time - last time >= K).",
            starterCode: {
                java: `import java.util.*;

public class SpamFilter {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
                python: `def solve():
    # Your code here
    pass

if __name__ == '__main__':
    solve()`,
                "c++": `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`
            },
            timeLimit: 900,
            testCases: {
                create: [
                    { input: "5 3\n1 2 4 6 7", expected: "2", isHidden: false },
                    { input: "5 2\n1 3 5 7 9", expected: "0", isHidden: false },
                    { input: "5 5\n1 2 3 4 5", expected: "4", isHidden: true },
                ],
            },
        },
    });
    await prisma.problem.create({
        data: {
            title: "Session Window Analyzer",
            description: `A platform records login durations in minutes for N users. You are given a threshold K and must find the longest contiguous segment where every duration is <= K.

Input Format:
- First line: N K
- Second line: N space-separated integers

Output Format:
- Length of the longest valid contiguous segment.`,
            difficulty: "Medium",
            roundNumber: 2,
            hint: "Simulate a sliding window by iterating linearly. If value <= K, extend your window. If > K, reset your window length to 0.",
            starterCode: {
                java: `import java.util.*;

public class SessionAnalyzer {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
                python: `def solve():
    # Your code here
    pass

if __name__ == '__main__':
    solve()`,
                "c++": `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`
            },
            timeLimit: 900,
            testCases: {
                create: [
                    { input: "8 5\n2 3 6 1 4 5 7 2", expected: "3", isHidden: false },
                    { input: "5 10\n1 2 3 4 5", expected: "5", isHidden: false },
                    { input: "6 3\n4 4 4 4 4 4", expected: "0", isHidden: true },
                ],
            },
        },
    });
    await prisma.problem.create({
        data: {
            title: "Deadline Burst Scheduler",
            description: `You have N jobs. Each job takes 1 unit time and has a deadline d and reward r. You can complete at most one job per time slot. Maximize total reward by scheduling before deadlines.

Input Format:
- First line: N
- Next N lines: deadline reward

Output Format:
- Maximum total reward.`,
            difficulty: "Medium",
            roundNumber: 2,
            hint: "Sort jobs by deadline. Use a Min-Heap to store the *rewards* of selected jobs. If your selected jobs exceed the current deadline, remove the job with the minimum reward.",
            starterCode: {
                java: `import java.util.*;

public class BurstScheduler {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
                python: `def solve():
    # Your code here
    pass

if __name__ == '__main__':
    solve()`,
                "c++": `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`
            },
            timeLimit: 900,
            testCases: {
                create: [
                    { input: "4\n4 70\n1 80\n1 30\n2 100", expected: "250", isHidden: false },
                    { input: "3\n1 20\n2 50\n2 10", expected: "70", isHidden: false },
                    { input: "5\n2 100\n1 19\n2 27\n1 25\n3 15", expected: "142", isHidden: true },
                ],
            },
        },
    });
    // ── Round 2: Debugging MCQ Questions ──
    // ── Round 2: Debugging Sniper ──
    const r2p1 = await prisma.problem.create({
        data: {
            title: "Inheritance & Constructor Chaining",
            description: `The following program models Employees and Managers in a company.
Managers receive a bonus added to their salary. The program should display the correct salary for both employees.
However, the code contains several syntax and logical errors. Debug and fix it.`,
            difficulty: "Medium",
            roundNumber: 1,
            starterCode: {
                java: `class Employee {

    protected String name
    protected double salary;

    Employee(String name, double salary){
        name = name;
        salary = salary;
    }

    public void displayInfo(){
        System.out.println("Employee Name: " + name)
        System.out.println("Salary: " + salary);
    }

    public double calculateSalary(){
        return salary
    }
}

class Manager extends Employee {

    private double bonus;

    Manager(String name, double salary, double bonus){

        this.bonus = bonus;

    }

    public double calculateSalary(){

        return salary + bonus

    }

    public void displayinfo(){

        System.out.println("Manager Name: " + name);
        System.out.println("Total Salary: " + calculateSalary());
    }
}

public class Company {

    public static void main(String args[]) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String n1 = sc.next();
        double s1 = sc.nextDouble(); // bug: scanner might need nextDouble
        String n2 = sc.next();
        double s2 = sc.nextDouble();
        double b2 = sc.nextDouble();

        Employee e1 = new Employee(n1, s1)

        Manager m1 = new Manager(n2, s2, b2);

        e1.displayInfo();

        m1.displayInfo();

    }
}`,
                python: `class Employee:
    def __init__(self, name, salary):
        name = name  
        salary = salary 

    def display_info(self):
        print("Employee Name: " + name) 
        print("Salary: " + str(salary))

    def calculate_salary(self):
        return salary

class Manager(Employee):
    def __init__(self, name, salary, bonus):
        self.bonus = bonus

    def calculate_salary(self):
        return salary + bonus

    def display_info(self):
        print("Manager Name: " + self.name)
        print("Total Salary: " + str(self.calculate_salary()))

if __name__ == "__main__":
    line1 = input().split()
    n1 = line1[0]
    s1 = float(line1[1])
    
    line2 = input().split()
    n2 = line2[0]
    s2 = float(line2[1])
    b2 = float(line2[2])

    e1 = Employee(n1, s1)
    m1 = Manager(n2, s2, b2)

    e1.display_info()
    m1.display_info()`,
                "c++": `#include <iostream>
#include <string>
using namespace std;

class Employee {
protected:
    string name;
    double salary;

public:
    Employee(string n, double s) {
        name = n;
        salary = s;
    }

    void displayInfo() {
        cout << "Employee Name: " << name << endl
        cout << "Salary: " << salary << endl;
    }

    double calculateSalary() {
        return salary;
    }
};

class Manager : Employee {
    double bonus;

public:
    Manager(string n, double s, double b) : Employee(n, s) {
        bonus = b;
    }

    double calculateSalary() {
        return salary + bonus;
    }

    void displayInfo() {
        cout << "Manager Name: " << name << endl;
        cout << "Total Salary: " << calculateSalary() << endl;
    }
};

int main() {
    string n1, n2;
    double s1, s2, b2;
    
    cin >> n1 >> s1;
    cin >> n2 >> s2 >> b2;

    Employee e1(n1, s1);
    Manager m1(n2, s2, b2);

    e1.displayInfo();
    m1.displayInfo();

    return 0;
}`
            },
            timeLimit: 900,
            testCases: {
                create: [
                    {
                        input: "Rahul 50000\nPriya 70000 10000",
                        expected: `Employee Name: Rahul
Salary: 50000.0
Manager Name: Priya
Total Salary: 80000.0`,
                        isHidden: false
                    },
                    {
                        input: "Alice 60000\nBob 80000 15000",
                        expected: `Employee Name: Alice
Salary: 60000.0
Manager Name: Bob
Total Salary: 95000.0`,
                        isHidden: false
                    },
                    {
                        input: "John 40000\nDoe 90000 5000",
                        expected: `Employee Name: John
Salary: 40000.0
Manager Name: Doe
Total Salary: 95000.0`,
                        isHidden: false
                    },
                ],
            },
        },
    });
    const r2p2 = await prisma.problem.create({
        data: {
            title: "Abstraction, Polymorphism & Interfaces",
            description: `The program models a payment system where users can pay using Credit Card or PayPal.
However, the code contains syntax mistakes, incorrect overrides, and logical issues. Fix it so payments process correctly.`,
            difficulty: "Medium",
            roundNumber: 1,
            starterCode: {
                java: `public class PaymentSystem {

    public static void main(String args[]) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String name = sc.next();
        double bal = sc.nextDouble();
        double amt = sc.nextDouble();

        Payment p;

        Customer c = new Customer(name, bal);

        p = c;

        c.displayUser();

        p.pay(amt);

        System.out.println("Remaining Balance: " + c.walletBalance);

    }

}


interface Payment {

    void pay(double amount)

}

abstract class User {

    String name;

    User(String name) {
        name = name;
    }

    abstract void displayUser();

}

class Customer extends User implements Payment {

    double walletBalance;

    Customer(String name, double balance) {
        super(name);
        walletBalance = balance;
    }

    public void pay(double amount) {

        if (walletBalance < amount) {
            walletBalance = walletBalance - amount;
            System.out.println("Payment Successful");
        } else {
            System.out.println("Insufficient Balance");
        }

    }

    public void displayUser() {
        System.out.println("Customer: " + name);
    }

}`,
                python: `from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount):
        pass

class User(ABC):
    def __init__(self, name):
        name = name

    @abstractmethod
    def display_user(self):
        pass

class Customer(User, Payment):
    def __init__(self, name, balance):
        super().__init__(name)
        self.wallet_balance = balance

    def pay(self, amount):
        if self.wallet_balance < amount:
            self.wallet_balance = self.wallet_balance - amount
            print("Payment Successful")
        else:
            print("Insufficient Balance")

    def display_user(self):
        print("Customer: " + self.name)

if __name__ == "__main__":
    line = input().split()
    name = line[0]
    bal = float(line[1])
    amt = float(input())

    c = Customer(name, bal)
    c.display_user()
    c.pay(amt)
    print("Remaining Balance: " + str(c.wallet_balance))`,
                "c++": `#include <iostream>
#include <string>
using namespace std;

class Payment {
public:
    virtual void pay(double amount) = 0;
};

class User {
protected:
    string name;
public:
    User(string n) : name(n) {}
    virtual void displayUser() = 0;
};

class Customer : public User, public Payment {
    double walletBalance;
public:
    Customer(string n, double b) : User(n) {
        walletBalance = b;
    }

    void pay(double amount) override {
        if (walletBalance < amount) {
            walletBalance -= amount;
            cout << "Payment Successful" << endl;
        } else {
            cout << "Insufficient Balance" << endl;
        }
    }

    void displayUser() override {
        cout << "Customer: " << name << endl;
    }

    double getBalance() { return walletBalance; }
};

int main() {
    string name;
    double bal, amt;
    cin >> name >> bal >> amt;

    Customer c(name, bal);
    Payment* p = &c;

    c.displayUser();
    p->pay(amt);

    cout << "Remaining Balance: " << c.getBalance() << endl;
    return 0;
}`
            },
            timeLimit: 900,
            testCases: {
                create: [
                    {
                        input: "Arjun 2000\n500",
                        expected: `Customer: Arjun
Payment Successful
Remaining Balance: 1500.0`,
                        isHidden: false
                    },
                    {
                        input: "Karan 1000\n1500",
                        expected: `Customer: Karan
Insufficient Balance
Remaining Balance: 1000.0`,
                        isHidden: false
                    },
                    {
                        input: "Zara 5000\n5000",
                        expected: `Customer: Zara
Payment Successful
Remaining Balance: 0.0`,
                        isHidden: false
                    },
                ],
            },
        },
    });
    const r2p3 = await prisma.problem.create({
        data: {
            title: "Method Overloading & Static vs Instance",
            description: `The program models a Library system that tracks the number of books issued.
However, several logical and syntax errors prevent correct behavior. Fix the program.`,
            difficulty: "Medium",
            roundNumber: 1,
            starterCode: {
                java: `class Library {

    private String bookName;
    private int issuedBooks;

    static int totalIssued;

    Library(String name) {
        bookName = name;
        issuedBooks = 0
    }

    public void issueBook() {

        issuedBooks++;
        totalIssued + 1;

    }

    public void issueBook(int quantity) {

        issuedBooks = issuedBooks + quantity
        totalIssued = totalIssued + quantity;

    }

    public int getIssuedBooks() {
        return issuedbooks;
    }


    public static void main(String args[]) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String n1 = sc.next();
        String n2 = sc.next();
        int q1 = sc.nextInt();
        int q2 = sc.nextInt();

        Library l1 = new Library(n1);
        Library l2 = new Library(n2);

        l1.issueBook();
        l1.issueBook(q1);
        l2.issueBook(q2);

        System.out.println("Books issued from l1: " + l1.getIssuedBooks());
        System.out.println("Total books issued: " + totalIssued);
    }

}`,
                python: `class Library:
    total_issued = 0

    def __init__(self, name):
        self.book_name = name
        self.issued_books = 0

    def issue_book(self, quantity=1):
        issued_books = issued_books + quantity
        total_issued = total_issued + quantity

    def get_issued_books(self):
        return issued_books

if __name__ == "__main__":
    line = input().split()
    n1 = line[0]
    n2 = line[1]
    q1 = int(line[2])
    q2 = int(line[3])

    l1 = Library(n1)
    l2 = Library(n2)

    l1.issue_book()
    l1.issue_book(q1)
    l2.issue_book(q2)

    print("Books issued from l1: " + str(l1.get_issued_books()))
    print("Total books issued: " + str(Library.total_issued))`,
                "c++": `#include <iostream>
#include <string>
using namespace std;

class Library {
    string bookName;
    int issuedBooks;
    
public:
    static int totalIssued;

    Library(string name) {
        bookName = name;
        issuedBooks = 0;
    }

    void issueBook() {
        issuedBooks++;
        totalIssued++;
    }

    // Overloading
    void issueBook(int quantity) {
        issuedBooks += quantity;
        totalIssued += quantity;
    }

    int getIssuedBooks() {
        return issuedBooks;
    }
};

int main() {
    string n1, n2;
    int q1, q2;
    cin >> n1 >> n2 >> q1 >> q2;

    Library l1(n1);
    Library l2(n2);

    l1.issueBook();
    l1.issueBook(q1);
    l2.issueBook(q2);

    cout << "Books issued from l1: " << l1.getIssuedBooks() << endl;
    cout << "Total books issued: " << Library::totalIssued << endl;

    return 0;
}`
            },
            timeLimit: 900,
            testCases: {
                create: [
                    {
                        input: "Java OS 2 3",
                        expected: `Books issued from l1: 3
Total books issued: 6`,
                        isHidden: false
                    },
                    {
                        input: "CPP Python 5 5",
                        expected: `Books issued from l1: 6
Total books issued: 11`,
                        isHidden: false
                    },
                    {
                        input: "React Node 10 20",
                        expected: `Books issued from l1: 11
Total books issued: 31`,
                        isHidden: false
                    },
                ],
            },
        },
    });
    // ── Round 3: MVP Problem Statements ──
    await prisma.problem.create({
        data: {
            title: "Student Attendance Dashboard",
            description: `Build a web-based Student Attendance Dashboard MVP.

Requirements:
- A simple UI where a teacher can mark attendance for students
- Display a list of students with Present/Absent toggle
- Show attendance summary (total present, total absent, percentage)
- Data can be stored in-memory or localStorage (no backend required)

Tech: Use any framework/library. Focus on clean UI and working functionality.
Time: You have the full round duration to build this on VS Code.`,
            difficulty: "Medium",
            roundNumber: 3,
            timeLimit: 2700,
        },
    });
    await prisma.problem.create({
        data: {
            title: "Event Registration Portal",
            description: `Build a web-based Event Registration Portal MVP.

Requirements:
- Landing page with event details
- Registration form (name, email, phone, college)
- Display registered participants in a table/list
- Basic form validation
- Data can be stored in-memory or localStorage

Tech: Use any framework/library. Focus on clean UI and working functionality.
Time: You have the full round duration to build this on VS Code.`,
            difficulty: "Medium",
            roundNumber: 3,
            timeLimit: 2700,
        },
    });
    const round1Count = await prisma.problem.count({ where: { roundNumber: 1 } });
    const round2ProblemCount = await prisma.problem.count({ where: { roundNumber: 2 } });
    const round3Count = await prisma.problem.count({ where: { roundNumber: 3 } });
    console.log("Seed complete.");
    console.log("  Admin: admin@gdg.local / Admin@123");
    console.log(`  Round 1 debugging problems: ${round1Count}`);
    console.log(`  Round 2 DSA problems: ${round2ProblemCount} (base IDs: ${p1.id}, ${p2.id}, ${p3.id})`);
    console.log(`  Round 3 MVP problems: ${round3Count}`);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
