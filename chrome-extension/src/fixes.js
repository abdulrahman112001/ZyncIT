// Fixed loadSMS and loadCalls using collectionGroup
// Replace the existing functions with these

// Load SMS using collectionGroup
async function loadSMS() {
  if (!currentUser) return;
  
  const q = query(
    collectionGroup(db, 'sms'),
    where('userId', '==', currentUser.uid),
    orderBy('timestamp', 'desc'),
    limit(50),
  );

  const unsub = onSnapshot(
    q,
    snapshot => {
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
  
  const q = query(
    collectionGroup(db, 'calls'),
    where('userId', '==', currentUser.uid),
    orderBy('timestamp', 'desc'),
    limit(50),
  );

  const unsub = onSnapshot(
    q,
    snapshot => {
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
