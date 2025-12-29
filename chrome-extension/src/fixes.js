// Fixed loadSMS and loadCalls using collectionGroup
// Replace the existing functions with these

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

  const unsub = onSnapshot(
    q,
    snapshot => {
      console.log('SMS found:', snapshot.size);
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      renderSMS(messages);
    },
    error => {
      console.error('SMS Error:', error);
    },
  );

  unsubscribers.push(unsub);
}

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

  const unsub = onSnapshot(
    q,
    snapshot => {
      console.log('Calls found:', snapshot.size);
      const calls = [];
      snapshot.forEach(doc => {
        calls.push({ id: doc.id, ...doc.data() });
      });
      renderCalls(calls);
    },
    error => {
      console.error('Calls Error:', error);
    },
  );

  unsubscribers.push(unsub);
}
