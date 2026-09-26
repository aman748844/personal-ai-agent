/**
 * Computer Workflow (Section 3 Test Case 1 of PDF)
 * Desktop folder creation, file operations, process monitoring.
 */

function buildCreateDesktopFolderWorkflow(folderName = 'TestFolder') {
  return {
    goal: `Create a folder named ${folderName} on Desktop`,
    steps: [
      {
        tool: 'filesystem.create_directory',
        path: `USER_DESKTOP/${folderName}`
      },
      {
        tool: 'filesystem.exists',
        path: `USER_DESKTOP/${folderName}`
      }
    ]
  };
}

module.exports = {
  buildCreateDesktopFolderWorkflow
};
