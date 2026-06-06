import subprocess
import os

env = os.environ.copy()
env['JAVA_HOME'] = r'C:\jdk17\jdk-17.0.12'
env['PATH'] = r'C:\jdk17\jdk-17.0.12\bin;' + env.get('PATH', '')

sdkmanager = r'C:\Users\lucky\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat'

licenses_input = '\n'.join(['y'] * 20) + '\n'

p = subprocess.Popen(
    [sdkmanager, '--licenses'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    env=env,
    text=True
)

out, _ = p.communicate(input=licenses_input)
print(out[-1000:] if out else 'No output')
print(f'Exit code: {p.returncode}')
