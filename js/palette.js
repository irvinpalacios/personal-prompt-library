export const PALETTE_COMMANDS = [
  {
    id: "new-prompt",
    label: "New prompt",
  },
];

export function getPaletteCommand(commandId) {
  return PALETTE_COMMANDS.find((command) => command.id === commandId) || null;
}
