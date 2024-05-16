import { useState, useEffect } from "react";
import { Container, Textarea, VStack, Text, Box } from "@chakra-ui/react";

const codeSnippet = `
import subprocess
import time

from pathlib import Path
from typing import Optional, Tuple, Union

from gpt_engineer.core.base_execution_env import BaseExecutionEnv
from gpt_engineer.core.default.file_store import FileStore
from gpt_engineer.core.files_dict import FilesDict

class DiskExecutionEnv(BaseExecutionEnv):
    """
    An execution environment that runs code on the local file system and captures
    the output of the execution.

    This class is responsible for executing code that is stored on disk. It ensures that
    the necessary entrypoint file exists and then runs the code using a subprocess. If the
    execution is interrupted by the user, it handles the interruption gracefully.

    Attributes
    ----------
    store : FileStore
        An instance of FileStore that manages the storage of files in the execution
        environment.
    """

    def __init__(self, path: Union[str, Path, None] = None):
        self.files = FileStore(path)

    def upload(self, files: FilesDict) -> "DiskExecutionEnv":
        self.files.push(files)
        return self

    def download(self) -> FilesDict:
        return self.files.pull()

    def popen(self, command: str) -> subprocess.Popen:
        p = subprocess.Popen(
            command,
            shell=True,
            cwd=self.files.working_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        return p

    def run(self, command: str, timeout: Optional[int] = None) -> Tuple[str, str, int]:
        start = time.time()
        print("\\n--- Start of run ---")
        # while running, also print the stdout and stderr
        p = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=self.files.working_dir,
            text=True,
            shell=True,
        )
        print("$", command)
        stdout_full, stderr_full = "", ""

        try:
            while p.poll() is None:
                assert p.stdout is not None
                assert p.stderr is not None
                stdout = p.stdout.readline()
                stderr = p.stderr.readline()
                if stdout:
                    print(stdout, end="")
                    stdout_full += stdout
                if stderr:
                    print(stderr, end="")
                    stderr_full += stderr
                if timeout and time.time() - start > timeout:
                    print("Timeout!")
                    p.kill()
                    raise TimeoutError()
        except KeyboardInterrupt:
            print()
            print("Stopping execution.")
            print("Execution stopped.")
            p.kill()
            print()
            print("--- Finished run ---\\n")

        return stdout_full, stderr_full, p.returncode
`;

const Index = () => {
  const [displayedCode, setDisplayedCode] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const codeWords = codeSnippet.split(/\s+/);

  const handleKeyPress = () => {
    if (currentIndex < codeWords.length) {
      setDisplayedCode((prev) => prev + codeWords[currentIndex] + " ");
      setCurrentIndex((prev) => prev + 1);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentIndex]);

  return (
    <Container centerContent maxW="container.md" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <VStack spacing={4}>
        <Text fontSize="2xl">Pretend to Code</Text>
        <Textarea value={displayedCode} readOnly height="400px" width="100%" />
        <Box>
          <Text>Start typing to see the code appear!</Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default Index;
