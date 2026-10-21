package com.applyiq.demo;

import java.util.Map;

/**
 * Text content for the preview account (see PreviewAccountSeeder): a realistic job description per
 * sample application, keyed by company name, and the parsed text of the sample resumes. Written to
 * name skills from SkillTaxonomy so the keyword pass finds them; avoid words that contain a skill
 * as a substring by accident ("digital" contains "Git", "laws" contains "AWS").
 */
final class DemoContent {

    static final String SWE_RESUME = """
            Caleb Kim
            caleb.kim@applyiq.com | github.com/caleb-j-kim

            EDUCATION
            B.S. in Computer Science, expected May 2027 | GPA 3.7/4.0
            Coursework: Data Structures and Algorithms, Operating Systems, Database Systems, Software Engineering

            EXPERIENCE
            Software Engineering Intern | Fintech startup | Summer 2025
            - Built REST APIs in Java and Spring Boot backed by PostgreSQL, cutting median response time by 35% after reworking slow queries and indexes
            - Packaged three services with Docker and deployed them to AWS (EC2, RDS, S3)
            - Raised backend test coverage from 48% to 81% by adding unit testing with JUnit and Mockito
            - Worked on an Agile team with two-week sprints, code reviews and daily standups

            Teaching Assistant | Intro to Programming | Fall 2024 - Present
            - Mentoring 40+ students a semester in Python through weekly labs and office hours

            PROJECTS
            ApplyIQ | AI-powered job application tracker
            - React and TypeScript front end with a Spring Boot and PostgreSQL REST API, deployed with Docker
            - Resume-to-job matching that combines keyword extraction with the Claude API
            - Automated builds and tests with GitHub Actions
            Campus Eats | Food truck locator
            - Node.js and JavaScript web app with a MySQL database and Google Maps integration

            SKILLS
            Languages: Java, Python, JavaScript, TypeScript, SQL
            Frameworks: Spring Boot, React, Node.js
            Tools: PostgreSQL, MySQL, Docker, AWS, Git, GitHub Actions
            """;

    static final String DATA_RESUME = """
            Caleb Kim
            caleb.kim@applyiq.com | github.com/caleb-j-kim

            EDUCATION
            B.S. in Computer Science, expected May 2027 | GPA 3.7/4.0
            Coursework: Database Systems, Probability and Statistics, Machine Learning, Data Structures and Algorithms

            EXPERIENCE
            Data Analyst Intern | Regional healthcare network | Summer 2025
            - Wrote SQL against PostgreSQL and MySQL to build weekly operations dashboards in Tableau
            - Cut a 40-minute reporting job to 6 minutes through query optimization and new indexes
            - Led the database design for a reporting schema now used by four analytics teams
            - Presented findings to clinic directors, building communication skills with non-technical audiences

            Teaching Assistant | Intro to Programming | Fall 2024 - Present
            - Run weekly Python labs and office hours for 40+ students

            PROJECTS
            Job Market Trends | Python (pandas, scikit-learn) pipeline that collects postings and stores them on AWS S3
            ApplyIQ | Built the analytics module in Java and Spring Boot on PostgreSQL

            SKILLS
            Languages: Python, SQL, Java, R
            Tools: PostgreSQL, MySQL, AWS, Git, Tableau, Jupyter
            """;

    static final Map<String, String> JOB_DESCRIPTIONS = Map.ofEntries(
            Map.entry("Capital One", """
                    About the role
                    Capital One's Technology Internship Program places interns on real product teams building the platforms behind our banking and card products. You'll ship code to production in your first weeks and partner with engineers, product managers and designers.

                    What you'll do
                    - Build and maintain secure REST APIs using Java, Spring Boot and PostgreSQL
                    - Deploy services to AWS using Docker and our CI/CD pipelines
                    - Practice unit testing and take part in code reviews
                    - Work on an Agile team with two-week sprints

                    Basic qualifications
                    - Currently pursuing a Bachelor's degree in Computer Science or a related field
                    - Experience with at least one of Java, Python, JavaScript or Go

                    Preferred qualifications
                    - Familiarity with Microservices and Kubernetes
                    - Experience with Git and cloud platforms such as AWS
                    """),
            Map.entry("Google", """
                    Minimum qualifications
                    - Currently pursuing a Bachelor's or Master's degree in Computer Science or a related technical field
                    - Experience with data structures and algorithms
                    - Experience in software development in one or more programming languages such as Java, C++, Python or Go

                    Preferred qualifications
                    - Experience with distributed systems, system design or large-scale infrastructure
                    - Interest in problem solving across a wide range of technical areas
                    - Ability to work well in a team and learn new codebases quickly

                    About the job
                    As a Software Engineering Intern, you'll work on a project critical to Google's needs, with opportunities to switch teams and projects as you grow. You'll design, test, deploy and maintain software, and review code with your host team. Projects may span distributed systems, cloud platforms like GCP, machine learning, mobile and web.
                    """),
            Map.entry("Stripe", """
                    About the team
                    Stripe's Payments Infrastructure team builds the systems that move money for millions of businesses around the world.

                    What you'll do
                    - Own API design for services that are reliable, well documented and a pleasure to integrate with
                    - Build and operate services in Ruby and Java running on AWS
                    - Improve the scalability and reliability of distributed systems handling billions of requests
                    - Extend our event-driven architecture built on Kafka

                    Who you are
                    - 2+ years building backend services
                    - Strong SQL skills and experience with relational databases such as MySQL or PostgreSQL
                    - Experience running Microservices in production
                    - Comfortable with system design trade-offs and clear written communication
                    """),
            Map.entry("Deloitte", """
                    Deloitte's Technology Strategy & Transformation practice helps clients modernize the systems that run their business.

                    Work you'll do
                    - Partner with client stakeholders to gather requirements and turn them into technical solutions
                    - Support cloud migrations to Azure and AWS
                    - Build reports and data models using SQL
                    - Facilitate Agile ceremonies, including sprint planning and retrospectives

                    Required
                    - Bachelor's degree in Computer Science, Information Systems or a related field
                    - Strong communication and cross-functional collaboration skills
                    - Willingness to travel up to 50%

                    Preferred
                    - Experience with Python or Power BI
                    - Exposure to cloud infrastructure and leadership of small project teams
                    """),
            Map.entry("Microsoft", """
                    As a Product Manager Intern, you'll own a feature area end to end: talking to customers, defining requirements, and working with engineering and design to ship it.

                    Responsibilities
                    - Define the vision and write specs for features in Microsoft Azure
                    - Prioritize the backlog and run sprint planning with your engineering team
                    - Use data and SQL queries to measure feature adoption
                    - Present your work to leadership at the end of the summer

                    Qualifications
                    - Pursuing a Bachelor's or Master's degree in Computer Science, Engineering or a related field
                    - Strong communication, problem solving and cross-functional collaboration skills
                    - Some programming experience in Python, C# or JavaScript is a plus
                    """),
            Map.entry("Booz Allen Hamilton", """
                    Booz Allen is seeking a Java Developer to modernize mission-critical applications for a federal health client.

                    You'll
                    - Develop backend services in Java with Spring Boot, Spring Security and Hibernate
                    - Design and build REST APIs consumed by React front ends
                    - Move legacy applications to containers using Docker and Kubernetes on AWS GovCloud
                    - Maintain CI/CD pipelines in Jenkins

                    You have
                    - 2+ years of experience with Java and SQL
                    - Experience with Oracle or PostgreSQL
                    - Ability to obtain and maintain a Public Trust clearance

                    Nice if you have
                    - Experience on Agile teams using Scrum
                    """),
            Map.entry("Fintasy", """
                    Fintasy is a small, fast-moving team building fantasy-sports-style investing games for first-time investors.

                    What you'll do
                    - Ship features across the stack: React and TypeScript on the front end, Node.js and Express on the back end
                    - Design schemas and write queries for PostgreSQL
                    - Build and document REST APIs and a GraphQL layer for our mobile app
                    - Deploy with Docker and GitHub Actions to AWS

                    What we look for
                    - Strong JavaScript fundamentals
                    - Ownership: you take features from idea to production
                    - Clear communication on a remote-first team
                    """),
            Map.entry("JPMorgan Chase", """
                    As a Software Engineer Intern in Corporate & Investment Bank Technology, you'll build software that supports our trading and risk systems.

                    Responsibilities
                    - Develop applications in Java or Python following secure coding practices
                    - Contribute to Microservices running on AWS and our private cloud
                    - Own automated testing for your features and take part in code reviews
                    - Collaborate on an Agile team

                    Required qualifications
                    - Pursuing a degree in Computer Science, Engineering, Mathematics or a related field, graduating between December 2026 and June 2027
                    - Understanding of object-oriented programming, data structures and algorithms

                    Preferred qualifications
                    - Experience with SQL, React or Kafka
                    """),
            Map.entry("Palantir", """
                    Forward Deployed Software Engineers work directly with customers to solve their hardest problems using Palantir's platforms.

                    Core responsibilities
                    - Embed with customer teams to understand their operations and data
                    - Write production code in Java, Python and TypeScript to build integrations and applications on Foundry
                    - Model and transform data with SQL and Spark
                    - Travel to customer sites as needed

                    What we value
                    - A strong engineering background in Computer Science or a related field
                    - Problem solving, comfort with ambiguity and clear communication with non-technical audiences
                    - Ability to obtain a U.S. security clearance
                    - Experience with distributed systems or cloud infrastructure is a plus
                    """),
            Map.entry("Amazon", """
                    Amazon is looking for Software Development Engineer interns to design and build new technologies in a large distributed computing environment.

                    Key job responsibilities
                    - Design, implement, test and deploy features on Amazon-scale services
                    - Work with Java, Python or C++ and AWS services such as DynamoDB, Lambda and S3
                    - Own unit testing and integration testing for your features
                    - Work with senior engineers through code and system design reviews

                    Basic qualifications
                    - Currently enrolled in a Bachelor's degree program in Computer Science or a related field
                    - Experience with at least one modern language such as Java, Python or C++

                    Preferred qualifications
                    - Knowledge of distributed systems, NoSQL databases and scalability
                    - Demonstrated problem solving and Leadership Principles in past projects
                    """),
            Map.entry("Northrop Grumman", """
                    Northrop Grumman Mission Systems is seeking a Software Engineer to develop software for command and control systems.

                    Roles and responsibilities
                    - Develop and maintain applications in Java and Python on Linux
                    - Build containerized services with Docker and deploy them to Kubernetes
                    - Support CI/CD pipelines using Jenkins and Git
                    - Take part in Agile and Scrum ceremonies, including sprint planning

                    Basic qualifications
                    - Bachelor's degree in a STEM field
                    - Active DoD Secret clearance or the ability to obtain one

                    Preferred
                    - Experience with Microservices, Kafka and Infrastructure as Code (Terraform)
                    """),
            Map.entry("Datadog", """
                    Datadog's backend teams build the systems that ingest trillions of data points a day from our customers' infrastructure.

                    As an intern you will
                    - Build and improve high-throughput services in Go, Java or Python
                    - Work on distributed systems backed by Kafka, PostgreSQL and Cassandra
                    - Run services on Kubernetes across AWS, Azure and GCP
                    - Help improve the observability and scalability of our ingestion pipeline

                    Requirements
                    - Pursuing a BS/MS in Computer Science, graduating in 2027
                    - Solid grasp of data structures, algorithms and system design
                    - Experience with Git and unit testing

                    Bonus
                    - Experience with Docker or Terraform
                    """)
    );

    private DemoContent() {
    }
}
