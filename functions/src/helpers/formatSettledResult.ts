export function formatSettledResult(settledResult: any): string {
    let message = "🏆 Draw Results Declared!\n\n";

    for (const [category, data] of Object.entries(settledResult)) {
        const result = data as any;

        message += `${category}\n`;
        message += `• Winning Number: ${result.number}\n`;
        message += `• Winners: ${result.winners}\n\n`;
    }

    message += "🎉 Congratulations to all winners!";

    return message;
}