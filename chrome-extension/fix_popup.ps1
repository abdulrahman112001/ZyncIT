$content = Get-Content "C:\Dev\ZyncIT\chrome-extension\src\popup.js" -Raw

# 1. Add collectionGroup to imports if not exists
if ($content -notmatch "collectionGroup,") {
    $content = $content -replace "(import \{[\s\n]*getFirestore,)", "import {`n  getFirestore,`n  collectionGroup,"
}

# 2. New loadSMS function
$newLoadSMS = @'
// Load SMS using collectionGroup
async function loadSMS() {
  if (!currentUser) return;
  console.log('Loading SMS for user:', currentUser.uid);

  const q = query(
    collectionGroup(db, 'sms'),
    where('userId', '==', currentUser.uid),
    orderBy('timestamp', 'desc'),
    limit(50),
  );

  const unsub = onSnapshot(q, snapshot => {
    console.log('SMS found:', snapshot.size);
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    renderSMS(messages);
  }, error => {
    console.error('SMS Error:', error);
  });

  unsubscribers.push(unsub);
}
'@

# 3. New loadCalls function  
$newLoadCalls = @'
// Load Calls using collectionGroup
async function loadCalls() {
  if (!currentUser) return;
  console.log('Loading calls for user:', currentUser.uid);

  const q = query(
    collectionGroup(db, 'calls'),
    where('userId', '==', currentUser.uid),
    orderBy('timestamp', 'desc'),
    limit(50),
  );

  const unsub = onSnapshot(q, snapshot => {
    console.log('Calls found:', snapshot.size);
    const calls = [];
    snapshot.forEach(doc => {
      calls.push({ id: doc.id, ...doc.data() });
    });
    renderCalls(calls);
  }, error => {
    console.error('Calls Error:', error);
  });

  unsubscribers.push(unsub);
}
'@

# Replace loadSMS - match from "// Load SMS" to before "// Load Notifications"
$content = [regex]::Replace($content, '// Load SMS[\s\S]*?(?=// Load Notifications)', "$newLoadSMS`n`n")

# Replace loadCalls - match from "// Load Calls" to before "function renderCalls" 
$content = [regex]::Replace($content, '// Load Calls[\s\S]*?(?=function renderCalls)', "$newLoadCalls`n`n")

Set-Content "C:\Dev\ZyncIT\chrome-extension\src\popup.js" -Value $content -NoNewline
Write-Host "Done!"
