import { useState, useMemo } from 'react';
import { ShoppingCart, Receipt, BarChart3, Home, Plus, Minus, Trash2, TrendingUp, DollarSign, Package, Users, Settings, Edit, Save, X } from 'lucide-react';
import QRCode from 'qrcode';

// Type definitions for the application data
interface MenuItem {
    id: number;
    name: string;
    price: number;
    category: 'Food' | 'Drink' | 'Dessert';
}

interface OrderItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

interface Bill {
    id: number;
    date: string;
    items: OrderItem[];
    total: number;
    status: 'Paid' | 'Unpaid';
}

interface ShopSettings {
    shopName: string;
    promptPayNumber: string;
}

const initialMenuItems: MenuItem[] = [
    { id: 1, name: 'กะเพราไก่', price: 50, category: 'Food' },
    { id: 2, name: 'ข้าวไข่เจียว', price: 40, category: 'Food' },
    { id: 3, name: 'ชาเย็น', price: 25, category: 'Drink' },
    { id: 4, name: 'สเต๊กหมู', price: 120, category: 'Food' },
    { id: 5, name: 'น้ำเปล่า', price: 15, category: 'Drink' },
];

const initialBills: Bill[] = [
    { id: 1, date: '2025-08-01T10:00:00.000Z', items: [{ id: 1, name: 'กะเพราไก่', price: 50, quantity: 2 }], total: 100, status: 'Paid' },
    { id: 2, date: '2025-08-01T12:30:00.000Z', items: [{ id: 3, name: 'ชาเย็น', price: 25, quantity: 1 }, { id: 2, name: 'ข้าวไข่เจียว', price: 40, quantity: 1 }], total: 65, status: 'Paid' },
    { id: 3, date: '2025-08-02T09:15:00.000Z', items: [{ id: 4, name: 'สเต๊กหมู', price: 120, quantity: 1 }], total: 120, status: 'Paid' },
    { id: 4, date: '2025-08-02T15:00:00.000Z', items: [{ id: 1, name: 'กะเพราไก่', price: 50, quantity: 1 }], total: 50, status: 'Paid' },
];

export default function RestaurantApp() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
    const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
    const [bills, setBills] = useState<Bill[]>(initialBills);
    const [shopSettings, setShopSettings] = useState<ShopSettings>({ shopName: 'ร้านอาหารเจมีไน', promptPayNumber: '1234567890' });
    const [editingItem, setEditingItem] = useState<number | null>(null);

    const { todayRevenue, totalRevenue, topSellingItems } = useMemo(() => {
        const today = new Date().toDateString();
        const todayBills = bills.filter(bill => new Date(bill.date).toDateString() === today);
        const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.total, 0);
        const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);

        const itemSales: { [key: string]: number } = {};
        bills.forEach(bill => {
            bill.items.forEach(item => {
                itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
            });
        });

        const sortedItems = Object.entries(itemSales)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5);

        return { todayRevenue, totalRevenue, topSellingItems: sortedItems };
    }, [bills]);

    const addToOrder = (item: MenuItem) => {
        const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
        if (existingItem) {
            setCurrentOrder(currentOrder.map(orderItem =>
                orderItem.id === item.id
                    ? { ...orderItem, quantity: orderItem.quantity + 1 }
                    : orderItem
            ));
        } else {
            setCurrentOrder([...currentOrder, { ...item, quantity: 1 }]);
        }
    };

    const updateQuantity = (itemId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
        } else {
            setCurrentOrder(currentOrder.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    const removeFromOrder = (itemId: number) => {
        setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
    };

    const calculateTotal = (orderItems: OrderItem[]) => {
        return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const generateBill = () => {
        const newBill: Bill = {
            id: bills.length + 1,
            date: new Date().toISOString(),
            items: currentOrder,
            total: calculateTotal(currentOrder),
            status: 'Unpaid',
        };
        setBills([...bills, newBill]);
        setCurrentOrder([]);
        setCurrentPage('bill');
    };

    const payBill = (billId: number) => {
        setBills(bills.map(bill => bill.id === billId ? { ...bill, status: 'Paid' } : bill));
    };

    const generatePromptPayQR = (amount: number) => {
        if (!shopSettings.promptPayNumber) {
            return '';
        }
        const promptPayString = `00020101021230370016A0000006770101110113000${shopSettings.promptPayNumber}5404${amount.toFixed(2)}5802TH530376452044234590379963048991`;
        let qrCodeUrl = '';
        QRCode.toDataURL(promptPayString, { errorCorrectionLevel: 'H' }, (err, url) => {
            if (err) throw err;
            qrCodeUrl = url;
        });
        return qrCodeUrl;
    };

    const deleteMenuItem = (id: number) => {
        setMenuItems(menuItems.filter(item => item.id !== id));
    };

    const updateMenuItem = (id: number, updatedItem: MenuItem) => {
        setMenuItems(menuItems.map(item => item.id === id ? updatedItem : item));
    };

    const addMenuItem = (newItem: Omit<MenuItem, 'id'>) => {
        const newId = menuItems.length > 0 ? Math.max(...menuItems.map(item => item.id)) + 1 : 1;
        setMenuItems([...menuItems, { ...newItem, id: newId }]);
    };
    
    // --- Components for each page ---

    const DashboardPage = () => (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">หน้าหลัก</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500">รายได้วันนี้</p>
                        <p className="text-2xl font-semibold">₿{todayRevenue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="bg-green-100 text-green-600 p-3 rounded-full mr-4"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500">รายได้ทั้งหมด</p>
                        <p className="text-2xl font-semibold">₿{totalRevenue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full mr-4"><Package size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500">จำนวนเมนู</p>
                        <p className="text-2xl font-semibold">{menuItems.length}</p>
                    </div>
                </div>
            </div>
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">5 เมนูขายดีที่สุด</h3>
                <ul>
                    {topSellingItems.map(([name, quantity], index) => (
                        <li key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <p className="font-medium">{index + 1}. {name}</p>
                            <span className="text-gray-600">{quantity} จาน</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    const OrderPage = () => {
        const orderTotal = calculateTotal(currentOrder);
        return (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-4">เลือกเมนู</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {menuItems.map(item => (
                            <div key={item.id} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => addToOrder(item)}>
                                <h3 className="font-semibold">{item.name}</h3>
                                <p className="text-gray-600">₿{item.price}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
                    <h2 className="text-2xl font-bold mb-4">รายการสั่งซื้อ</h2>
                    <div className="flex-grow overflow-y-auto">
                        {currentOrder.length === 0 ? (
                            <p className="text-gray-500 text-center mt-8">ยังไม่มีรายการ</p>
                        ) : (
                            currentOrder.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                                    <div>
                                        <h4 className="font-medium">{item.name}</h4>
                                        <p className="text-sm text-gray-500">₿{item.price} x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-red-500 p-1"><Minus size={16} /></button>
                                        <span className="mx-2 font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-green-500 p-1"><Plus size={16} /></button>
                                        <button onClick={() => removeFromOrder(item.id)} className="text-red-500 p-1 ml-2"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 border-t pt-4">
                        <div className="flex justify-between items-center text-xl font-bold mb-4">
                            <span>รวมทั้งหมด:</span>
                            <span>₿{orderTotal.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={generateBill}
                            className="w-full bg-blue-500 text-white p-3 rounded-lg font-bold"
                            disabled={currentOrder.length === 0}
                        >
                            <Receipt size={20} className="inline-block mr-2" />
                            สร้างบิล
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const BillPage = () => {
        const latestBill = bills[bills.length - 1];
        if (!latestBill) {
            return (
                <div className="p-6 text-center text-gray-500">
                    <h2 className="text-2xl font-bold mb-4">ยังไม่มีบิลล่าสุด</h2>
                    <p>กรุณาทำการสั่งซื้อเพื่อสร้างบิล</p>
                </div>
            );
        }

        const qrCodeUrl = generatePromptPayQR(latestBill.total);

        return (
            <div className="p-6 flex flex-col items-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-blue-600">{shopSettings.shopName}</h2>
                        <p className="text-sm text-gray-500">บิลเลขที่ #{latestBill.id}</p>
                        <p className="text-sm text-gray-500">{new Date(latestBill.date).toLocaleString('th-TH')}</p>
                    </div>
                    <div className="border-t border-b py-4 mb-4">
                        <h3 className="font-semibold text-lg mb-2">รายการ</h3>
                        <ul>
                            {latestBill.items.map((item, index) => (
                                <li key={index} className="flex justify-between py-1">
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>₿{(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex justify-between text-2xl font-bold mb-6">
                        <span>รวมทั้งหมด</span>
                        <span className="text-green-600">₿{latestBill.total.toFixed(2)}</span>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-600 mb-2">ชำระเงินผ่าน PromptPay</p>
                        {qrCodeUrl && (
                            <img src={qrCodeUrl} alt="PromptPay QR Code" className="w-48 h-48 mx-auto" />
                        )}
                        <p className="font-medium mt-2">{shopSettings.promptPayNumber}</p>
                    </div>
                </div>
                <div className="mt-6 flex space-x-4">
                    {latestBill.status === 'Unpaid' && (
                        <button onClick={() => payBill(latestBill.id)} className="bg-green-500 text-white p-3 rounded-lg font-bold">
                            <DollarSign size={20} className="inline-block mr-2" />
                            ชำระแล้ว
                        </button>
                    )}
                    <button onClick={() => window.print()} className="bg-gray-500 text-white p-3 rounded-lg font-bold">
                        <Receipt size={20} className="inline-block mr-2" />
                        พิมพ์บิล
                    </button>
                    <button onClick={() => setCurrentPage('order')} className="bg-blue-500 text-white p-3 rounded-lg font-bold">
                        <Plus size={20} className="inline-block mr-2" />
                        ทำรายการใหม่
                    </button>
                </div>
            </div>
        );
    };

    const MenuPage = () => {
        const [newItem, setNewItem] = useState<Omit<MenuItem, 'id'>>({ name: '', price: 0, category: 'Food' });
        const [settingsForm, setSettingsForm] = useState(shopSettings);

        const handleNewItemSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (newItem.name && newItem.price > 0) {
                addMenuItem(newItem);
                setNewItem({ name: '', price: 0, category: 'Food' });
            }
        };

        const handleSettingsSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            setShopSettings(settingsForm);
        };

        const MenuItemEditForm = ({ item, onSave, onCancel }: { item: MenuItem; onSave: (updatedItem: MenuItem) => void; onCancel: () => void }) => {
            const [editItem, setEditItem] = useState(item);
            return (
                <div className="p-3 bg-gray-100 rounded-lg flex flex-col space-y-2">
                    <input
                        type="text"
                        value={editItem.name}
                        onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <input
                        type="number"
                        value={editItem.price}
                        onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })}
                        className="p-2 border rounded"
                    />
                    <div className="flex space-x-2">
                        <button onClick={() => onSave(editItem)} className="p-2 bg-green-500 text-white rounded"><Save size={16} /></button>
                        <button onClick={onCancel} className="p-2 bg-red-500 text-white rounded"><X size={16} /></button>
                    </div>
                </div>
            );
        };

        return (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">จัดการเมนู</h2>
                    <form onSubmit={handleNewItemSubmit} className="mb-4 flex flex-col space-y-2">
                        <input
                            type="text"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder="ชื่อเมนู"
                            className="p-2 border rounded"
                        />
                        <input
                            type="number"
                            value={newItem.price}
                            onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                            placeholder="ราคา"
                            className="p-2 border rounded"
                        />
                        <select
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value as 'Food' | 'Drink' | 'Dessert' })}
                            className="p-2 border rounded"
                        >
                            <option value="Food">อาหาร</option>
                            <option value="Drink">เครื่องดื่ม</option>
                            <option value="Dessert">ของหวาน</option>
                        </select>
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded font-bold">เพิ่มเมนู</button>
                    </form>
                    <div className="mt-6 space-y-2">
                        {menuItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                {editingItem === item.id ? (
                                    <MenuItemEditForm
                                        item={item}
                                        onSave={(updatedItem) => {
                                            updateMenuItem(item.id, updatedItem);
                                            setEditingItem(null);
                                        }}
                                        onCancel={() => setEditingItem(null)}
                                    />
                                ) : (
                                    <>
                                        <div className="flex-grow">
                                            <p className="font-medium">{item.name} - {item.price}₿</p>
                                            <p className="text-sm text-gray-500">หมวดหมู่: {item.category}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button onClick={() => setEditingItem(item.id)} className="p-1 text-blue-500"><Edit size={20} /></button>
                                            <button onClick={() => deleteMenuItem(item.id)} className="p-1 text-red-500"><Trash2 size={20} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">ตั้งค่าร้านค้า</h2>
                    <form onSubmit={handleSettingsSubmit} className="flex flex-col space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ชื่อร้าน</label>
                            <input
                                type="text"
                                value={settingsForm.shopName}
                                onChange={(e) => setSettingsForm({ ...settingsForm, shopName: e.target.value })}
                                className="mt-1 block w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">เบอร์ PromptPay</label>
                            <input
                                type="text"
                                value={settingsForm.promptPayNumber}
                                onChange={(e) => setSettingsForm({ ...settingsForm, promptPayNumber: e.target.value })}
                                className="mt-1 block w-full p-2 border rounded-md"
                            />
                        </div>
                        <button type="submit" className="bg-green-500 text-white p-2 rounded font-bold">บันทึกการตั้งค่า</button>
                    </form>
                </div>
            </div>
        );
    };

    const ReportPage = () => (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">รายงาน</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">ยอดขายทั้งหมด</h3>
                <p className="text-4xl font-extrabold text-green-600 mb-6">₿{totalRevenue.toFixed(2)}</p>
                <h3 className="text-xl font-bold mb-4">ประวัติบิล</h3>
                <div className="space-y-2">
                    {bills.slice().reverse().map(bill => (
                        <div key={bill.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">บิล #{bill.id}</p>
                                <p className="text-xs text-gray-500">{new Date(bill.date).toLocaleString('th-TH')}</p>
                                <p className="text-xs text-gray-500">{bill.items.length} รายการ</p>
                            </div>
                            <p className="font-semibold text-green-600">₿{bill.total.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    
    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage />;
            case 'order':
                return <OrderPage />;
            case 'bill':
                return <BillPage />;
            case 'menu':
                return <MenuPage />;
            case 'report':
                return <ReportPage />;
            default:
                return <DashboardPage />;
        }
    };
    
    return (
        <div className="bg-gray-100 min-h-screen font-sans flex flex-col">
            <header className="bg-blue-600 text-white p-4 shadow-md flex items-center justify-between">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold">{shopSettings.shopName}</h1>
                </div>
                <nav>
                    <ul className="flex space-x-2">
                        <li>
                            <button onClick={() => setCurrentPage('dashboard')} className={`p-2 rounded-lg ${currentPage === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
                                <Home size={24} />
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setCurrentPage('order')} className={`p-2 rounded-lg ${currentPage === 'order' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
                                <ShoppingCart size={24} />
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setCurrentPage('bill')} className={`p-2 rounded-lg ${currentPage === 'bill' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
                                <Receipt size={24} />
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setCurrentPage('menu')} className={`p-2 rounded-lg ${currentPage === 'menu' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
                                <Package size={24} />
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setCurrentPage('report')} className={`p-2 rounded-lg ${currentPage === 'report' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
                                <BarChart3 size={24} />
                            </button>
                        </li>
                    </ul>
                </nav>
            </header>
            <main className="flex-grow">
                {renderPage()}
            </main>
        </div>
    );
}