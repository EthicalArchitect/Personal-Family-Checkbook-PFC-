
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FamilyAccount, Transaction, User, TransactionCategory, ParsedReceipt, AuthState } from './types';
import { analyzeReceipt } from './services/geminiService';
import { PlusIcon, UserIcon, CameraIcon, SpinnerIcon } from './components/icons';

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
};


// --- Child Components ---

const AuthScreen: React.FC<{
    onCreateFamily: (adminName: string, adminEmail: string, familyName: string) => void;
    onJoinFamily: (userName: string, userEmail: string, familyId: string, passphrase: string) => void;
}> = ({ onCreateFamily, onJoinFamily }) => {
    const [view, setView] = useState<'create' | 'join'>('create');
    
    const [createName, setCreateName] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createFamilyName, setCreateFamilyName] = useState('');

    const [joinName, setJoinName] = useState('');
    const [joinEmail, setJoinEmail] = useState('');
    const [joinFamilyId, setJoinFamilyId] = useState('');
    const [joinPassphrase, setJoinPassphrase] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (createName && createEmail && createFamilyName) {
            onCreateFamily(createName, createEmail, createFamilyName);
        }
    };
    
    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinName && joinEmail && joinFamilyId && joinPassphrase) {
            onJoinFamily(joinName, joinEmail, joinFamilyId, joinPassphrase);
        }
    };

    const inputClasses = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
    const labelClasses = "block text-sm font-medium text-slate-400 mb-1";
    const buttonClasses = "w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors";

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
             <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-green-400">
                    Welcome to PFC Checkbook
                </h1>
                <p className="text-slate-400 mt-1">Your Personal Family Checkbook</p>
            </div>
            <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8">
                <div className="flex bg-slate-700 rounded-lg p-1 mb-6">
                    <button onClick={() => setView('create')} className={`w-1/2 rounded-md py-2 text-sm font-semibold ${view === 'create' ? 'bg-brand-primary text-white' : 'text-slate-300'}`}>Create Family</button>
                    <button onClick={() => setView('join')} className={`w-1/2 rounded-md py-2 text-sm font-semibold ${view === 'join' ? 'bg-brand-secondary text-white' : 'text-slate-300'}`}>Join Family</button>
                </div>

                {view === 'create' ? (
                    <form onSubmit={handleCreate} className="space-y-4">
                        <h2 className="text-xl font-bold text-center text-white">Create a New Family Account</h2>
                        <div>
                            <label htmlFor="createFamilyName" className={labelClasses}>Family Name</label>
                            <input id="createFamilyName" type="text" value={createFamilyName} onChange={e => setCreateFamilyName(e.target.value)} required className={inputClasses} placeholder="e.g., The Smiths"/>
                        </div>
                        <div>
                            <label htmlFor="createName" className={labelClasses}>Your Name</label>
                            <input id="createName" type="text" value={createName} onChange={e => setCreateName(e.target.value)} required className={inputClasses} placeholder="e.g., Jane Smith"/>
                        </div>
                        <div>
                            <label htmlFor="createEmail" className={labelClasses}>Your Email</label>
                            <input id="createEmail" type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} required className={inputClasses} placeholder="you@example.com"/>
                        </div>
                        <button type="submit" className={buttonClasses}>Create Family</button>
                    </form>
                ) : (
                    <form onSubmit={handleJoin} className="space-y-4">
                        <h2 className="text-xl font-bold text-center text-white">Join an Existing Family</h2>
                        <div>
                            <label htmlFor="joinFamilyId" className={labelClasses}>Family ID</label>
                            <input id="joinFamilyId" type="text" value={joinFamilyId} onChange={e => setJoinFamilyId(e.target.value)} required className={inputClasses} placeholder="Provided by family admin"/>
                        </div>
                         <div>
                            <label htmlFor="joinPassphrase" className={labelClasses}>Passphrase</label>
                            <input id="joinPassphrase" type="text" value={joinPassphrase} onChange={e => setJoinPassphrase(e.target.value)} required className={inputClasses} placeholder="6-character code"/>
                        </div>
                        <div>
                            <label htmlFor="joinName" className={labelClasses}>Your Name</label>
                            <input id="joinName" type="text" value={joinName} onChange={e => setJoinName(e.target.value)} required className={inputClasses} placeholder="e.g., John Smith"/>
                        </div>
                        <div>
                            <label htmlFor="joinEmail" className={labelClasses}>Your Email</label>
                            <input id="joinEmail" type="email" value={joinEmail} onChange={e => setJoinEmail(e.target.value)} required className={inputClasses} placeholder="you@example.com"/>
                        </div>
                        <button type="submit" className={buttonClasses}>Join Family</button>
                    </form>
                )}
            </div>
        </div>
    );
};

interface BalanceDisplayProps {
    balance: number;
}
const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balance }) => {
    const formattedBalance = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(balance);

    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg text-center mb-6">
            <p className="text-sm text-slate-400 uppercase tracking-wider">Family Balance</p>
            <p className={`text-4xl md:text-5xl font-bold mt-2 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formattedBalance}
            </p>
        </div>
    );
};

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyId: string;
    passphrase: string;
}
const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, familyId, passphrase }) => {
    if (!isOpen) return null;

    const inviteText = `Join my family on PFC Checkbook!\n\nFamily ID: ${familyId}\nPassphrase: ${passphrase}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteText);
        alert('Invite details copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">&times;</button>
                <h2 className="text-2xl font-bold mb-4">Invite a Family Member</h2>
                <p className="text-slate-400 mb-6">Share these details with them so they can join your family account.</p>
                
                <div className="space-y-4 text-left">
                    <div className="bg-slate-700 p-3 rounded-lg">
                        <label className="text-xs text-slate-400">Family ID</label>
                        <p className="font-mono text-lg text-white">{familyId}</p>
                    </div>
                    <div className="bg-slate-700 p-3 rounded-lg">
                        <label className="text-xs text-slate-400">Passphrase</label>
                        <p className="font-mono text-lg text-white">{passphrase}</p>
                    </div>
                </div>

                <button onClick={handleCopy} className="mt-6 w-full bg-brand-secondary hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                    Copy Invite Details
                </button>
            </div>
        </div>
    );
};

interface UserManagementProps {
    users: User[];
    onInvite: () => void;
}
const UserManagement: React.FC<UserManagementProps> = ({ users, onInvite }) => {
    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-300 mb-3">Family Members</h2>
            <div className="flex flex-wrap items-center gap-3">
                {users.map(user => (
                    <div key={user.id} className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded-full text-sm">
                        <UserIcon className="w-5 h-5 text-indigo-400" />
                        <span>{user.name}</span>
                    </div>
                ))}
                <button onClick={onInvite} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-sm transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Invite Member
                </button>
            </div>
        </div>
    );
};

interface TransactionListProps {
    transactions: Transaction[];
    users: User[];
}
const TransactionList: React.FC<TransactionListProps> = ({ transactions, users }) => {
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';
    
    if (transactions.length === 0) {
        return <p className="text-center text-slate-500 py-10">No transactions yet. Add one to get started!</p>;
    }

    return (
        <div>
             <h2 className="text-xl font-semibold text-slate-300 mb-4">Recent Transactions</h2>
            <ul className="space-y-3">
                {transactions.map(tx => (
                    <li key={tx.id} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center shadow-md">
                        <div>
                            <p className="font-semibold text-white">{tx.description}</p>
                            <p className="text-sm text-slate-400">{tx.category} &bull; by {getUserName(tx.userId)} &bull; {formatDate(tx.date)}</p>
                        </div>
                        <p className={`font-bold text-lg ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
    users: User[];
    currentUserId: string;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAddTransaction, users, currentUserId }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<TransactionCategory>(TransactionCategory.OTHER);
    const [userId, setUserId] = useState<string>(currentUserId);
    const [isExpense, setIsExpense] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setUserId(currentUserId);
    }, [currentUserId, isOpen]);
    
    const resetForm = useCallback(() => {
        setDescription('');
        setAmount('');
        setCategory(TransactionCategory.OTHER);
        setIsExpense(true);
        setUserId(currentUserId);
        setIsScanning(false);
        setScanError('');
    }, [currentUserId]);
    
    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!description || isNaN(numericAmount) || !userId) {
            alert('Please fill all fields correctly.');
            return;
        }

        onAddTransaction({
            description,
            amount: isExpense ? -numericAmount : numericAmount,
            category: category === TransactionCategory.INCOME && isExpense ? TransactionCategory.OTHER : category,
            userId,
        });
        handleClose();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsScanning(true);
            setScanError('');
            try {
                const base64Image = await fileToBase64(file);
                const receiptData: ParsedReceipt = await analyzeReceipt(base64Image);
                
                setDescription(receiptData.description || receiptData.merchant);
                setAmount(String(receiptData.total));
                setCategory(receiptData.category);
                setIsExpense(true); // Receipts are always expenses
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                setScanError(errorMessage);
            } finally {
                setIsScanning(false);
            }
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
                <button onClick={handleClose} className="absolute top-4 right-4 text-slate-500 hover:text-white text-3xl font-bold">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">Add Transaction</h2>
                
                <div className="mb-4">
                     <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                     >
                        {isScanning ? (
                            <>
                                <SpinnerIcon className="animate-spin w-5 h-5"/>
                                <span>Analyzing Receipt...</span>
                            </>
                        ) : (
                             <>
                                <CameraIcon className="w-6 h-6"/>
                                <span>Scan Receipt with AI</span>
                             </>
                        )}
                     </button>
                     {scanError && <p className="text-red-400 text-sm mt-2 text-center">{scanError}</p>}
                </div>
                
                 <div className="flex items-center my-6">
                    <hr className="flex-grow border-t border-slate-600"/>
                    <span className="px-3 text-slate-500 text-sm">OR ENTER MANUALLY</span>
                    <hr className="flex-grow border-t border-slate-600"/>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex bg-slate-700 rounded-lg p-1">
                        <button type="button" onClick={() => setIsExpense(true)} className={`w-1/2 rounded-md py-2 text-sm font-semibold ${isExpense ? 'bg-brand-primary text-white' : 'text-slate-300'}`}>Expense</button>
                        <button type="button" onClick={() => setIsExpense(false)} className={`w-1/2 rounded-md py-2 text-sm font-semibold ${!isExpense ? 'bg-brand-secondary text-white' : 'text-slate-300'}`}>Income</button>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                        <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                    </div>
                     <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-400 mb-1">Amount</label>
                        <input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                        <select id="category" value={category} onChange={e => setCategory(e.target.value as TransactionCategory)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                            {Object.values(TransactionCategory)
                                .filter(cat => isExpense ? cat !== TransactionCategory.INCOME : cat === TransactionCategory.INCOME)
                                .map(cat => <option key={cat} value={cat}>{cat}</option>)
                            }
                        </select>
                    </div>
                     <div>
                        <label htmlFor="user" className="block text-sm font-medium text-slate-400 mb-1">Member</label>
                        <select id="user" value={userId} onChange={e => setUserId(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">Add Transaction</button>
                </form>
            </div>
        </div>
    );
};

// --- Main App Component ---

export default function App() {
    const [authState, setAuthState] = useState<AuthState | null>(null);
    const [account, setAccount] = useState<FamilyAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    
    // Load auth state and corresponding account from local storage on mount
    useEffect(() => {
        try {
            const savedAuthState = localStorage.getItem('pfcAuthState');
            if (savedAuthState) {
                const parsedState: AuthState = JSON.parse(savedAuthState);
                const savedAccount = localStorage.getItem(`pfcFamily_${parsedState.familyAccountId}`);
                if (savedAccount) {
                    setAuthState(parsedState);
                    setAccount(JSON.parse(savedAccount));
                }
            }
        } catch (error) {
            console.error("Failed to load session from local storage", error);
            // Clear corrupted data
            localStorage.removeItem('pfcAuthState');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save account to local storage whenever it changes
    useEffect(() => {
        if (account && authState) {
            try {
                localStorage.setItem(`pfcFamily_${authState.familyAccountId}`, JSON.stringify(account));
            } catch (error) {
                console.error("Failed to save account to local storage", error);
            }
        }
    }, [account, authState]);

    const handleCreateFamily = (adminName: string, adminEmail: string, familyName: string) => {
        const familyId = `fam-${crypto.randomUUID().slice(0, 8)}`;
        const passphrase = crypto.randomUUID().slice(0, 6);
        const adminId = crypto.randomUUID();

        const newAccount: FamilyAccount = {
            id: familyId,
            name: familyName,
            passphrase,
            users: [{ id: adminId, name: adminName, email: adminEmail }],
            transactions: [],
        };
        const newAuthState: AuthState = { familyAccountId: familyId, currentUserId: adminId };

        localStorage.setItem(`pfcFamily_${familyId}`, JSON.stringify(newAccount));
        localStorage.setItem('pfcAuthState', JSON.stringify(newAuthState));
        
        setAccount(newAccount);
        setAuthState(newAuthState);
    };

    const handleJoinFamily = (userName: string, userEmail: string, familyId: string, passphrase: string) => {
        const savedAccountJSON = localStorage.getItem(`pfcFamily_${familyId}`);
        if (!savedAccountJSON) {
            alert("Family ID not found. Please check and try again.");
            return;
        }
        
        const familyAccount: FamilyAccount = JSON.parse(savedAccountJSON);
        if (familyAccount.passphrase !== passphrase) {
            alert("Incorrect passphrase. Please check and try again.");
            return;
        }

        if (familyAccount.users.some(u => u.email === userEmail)) {
            alert("This email address is already a member of this family.");
            return;
        }
        
        const userId = crypto.randomUUID();
        const newUser: User = { id: userId, name: userName, email: userEmail };
        
        const updatedAccount = { ...familyAccount, users: [...familyAccount.users, newUser] };
        const newAuthState: AuthState = { familyAccountId: familyId, currentUserId: userId };

        localStorage.setItem(`pfcFamily_${familyId}`, JSON.stringify(updatedAccount));
        localStorage.setItem('pfcAuthState', JSON.stringify(newAuthState));
        
        setAccount(updatedAccount);
        setAuthState(newAuthState);
    };

    const handleLogout = () => {
        localStorage.removeItem('pfcAuthState');
        setAuthState(null);
        setAccount(null);
    };

    const handleAddTransaction = (tx: Omit<Transaction, 'id' | 'date'>) => {
        if (account) {
            const newTransaction: Transaction = { 
                ...tx, 
                id: crypto.randomUUID(),
                date: new Date().toISOString()
            };
            const sortedTransactions = [newTransaction, ...account.transactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setAccount({ ...account, transactions: sortedTransactions });
        }
    };

    const balance = useMemo(() => {
        return account?.transactions.reduce((sum, tx) => sum + tx.amount, 0) || 0;
    }, [account?.transactions]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <SpinnerIcon className="w-12 h-12 animate-spin text-indigo-500"/>
        </div>;
    }

    if (!authState || !account) {
        return <AuthScreen onCreateFamily={handleCreateFamily} onJoinFamily={handleJoinFamily} />;
    }
    
    const currentUser = account.users.find(u => u.id === authState.currentUserId);
    if (!currentUser) {
        // This case should ideally not happen if data is consistent
        handleLogout();
        return null; 
    }

    return (
        <>
            <div className="min-h-screen bg-slate-900 text-white font-sans">
                <div className="container mx-auto max-w-3xl p-4 md:p-6">
                    <header className="my-6 flex justify-between items-center">
                        <div className="text-left">
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-green-400">
                                {account.name} Checkbook
                            </h1>
                            <p className="text-slate-400 mt-1">Logged in as {currentUser.name}</p>
                        </div>
                        <button onClick={handleLogout} className="bg-slate-700 hover:bg-slate-600 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Logout</button>
                    </header>
                    <main>
                        <BalanceDisplay balance={balance} />
                        <UserManagement users={account.users} onInvite={() => setInviteModalOpen(true)} />
                        <TransactionList transactions={account.transactions} users={account.users} />
                    </main>
                </div>
            </div>

            <button
                onClick={() => setAddModalOpen(true)}
                className="fixed bottom-6 right-6 bg-brand-primary hover:bg-indigo-500 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                aria-label="Add Transaction"
            >
                <PlusIcon className="w-8 h-8"/>
            </button>

            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAddTransaction={handleAddTransaction}
                users={account.users}
                currentUserId={currentUser.id}
            />
            <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                familyId={account.id}
                passphrase={account.passphrase}
            />
        </>
    );
}
