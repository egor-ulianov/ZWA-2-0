import { useState } from 'react';

import { runStaticTaskChecks } from './behavior/staticTaskChecks.js';
import ExerciseStage from './ExerciseStage.jsx';
import StudioEditor from './StudioEditor.jsx';
import StudioTabs from './StudioTabs.jsx';

export default function StaticExercise({
  id,
  task,
  draft = '',
  required = [],
  expected,
  language = 'text',
  fileName = 'source.txt',
  solution = draft,
}) {
  const [source, setSource] = useState(draft);
  const [results, setResults] = useState([]);

  function verify() {
    setResults(runStaticTaskChecks({ id, required }, source));
  }

  return (
    <ExerciseStage
      brief={typeof task === 'string' ? <p>{task}</p> : task}
      studio={
        <StudioTabs
          files={[
            {
              id: 'student-file',
              label: fileName,
              panel: (
                <StudioEditor
                  value={source}
                  onChange={(value) => {
                    setSource(value);
                    setResults([]);
                  }}
                  language={language}
                  label="Editor – zdrojový kód"
                  minHeight="360px"
                />
              ),
            },
          ]}
          solution={{
            label: 'Řešení',
            panel: (
              <StudioEditor
                value={solution}
                language={language}
                label={`Řešení — ${fileName}`}
                minHeight="360px"
                readOnly
              />
            ),
          }}
        />
      }
      preview={
        <div>
          <p>
            <strong>Očekávaný výsledek:</strong> {expected}
          </p>
          <p>Jde o statické vysvětlení; studentský kód se v prohlížeči nespouští.</p>
        </div>
      }
      verification={results}
      onVerify={verify}
      privateMarker={`static-${id}`}
      staticCheck
    />
  );
}
