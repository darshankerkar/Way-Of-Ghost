import { prisma } from "../config/prisma.js";
import { executeCode } from "./piston.service.js";
export async function runAgainstProblem(problemId, language, code) {
    const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        include: { testCases: true },
    });
    if (!problem) {
        throw new Error("Problem not found.");
    }
    if (problem.testCases.length === 0) {
        throw new Error("No test cases configured for this problem.");
    }
    let passed = 0;
    const details = [];
    for (const testCase of problem.testCases) {
        try {
            const result = await executeCode({
                language,
                source: code,
                stdin: testCase.input,
            });
            const compileStdErr = (result.compile?.stderr ?? "").trim();
            const compileStdOut = (result.compile?.stdout ?? "").trim();
            if (result.compile && result.compile.code !== 0) {
                details.push({
                    input: testCase.input,
                    expected: testCase.expected.trim(),
                    got: compileStdErr || compileStdOut || "Compilation failed",
                    pass: false,
                    isHidden: testCase.isHidden,
                });
                continue;
            }
            const stdout = (result.run.stdout ?? "").trim();
            const stderr = (result.run.stderr ?? "").trim();
            // If there's a runtime error, the test fails
            if (result.run.code !== 0) {
                details.push({
                    input: testCase.input,
                    expected: testCase.expected.trim(),
                    got: stderr || stdout || "Runtime error",
                    pass: false,
                    isHidden: testCase.isHidden,
                });
                continue;
            }
            const pass = stdout === testCase.expected.trim();
            if (pass)
                passed += 1;
            details.push({
                input: testCase.input,
                expected: testCase.expected.trim(),
                got: stdout,
                pass,
                isHidden: testCase.isHidden,
            });
        }
        catch (err) {
            details.push({
                input: testCase.input,
                expected: testCase.expected.trim(),
                got: `Execution error: ${err.message}`,
                pass: false,
                isHidden: testCase.isHidden,
            });
        }
    }
    return {
        passedTests: passed,
        totalTests: problem.testCases.length,
        accepted: passed === problem.testCases.length,
        // Only show non-hidden test case details
        details: details.filter((d) => !d.isHidden),
    };
}
