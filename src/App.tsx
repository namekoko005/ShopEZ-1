import { useState, useEffect } from 'react';
import { ShoppingCart, Receipt, BarChart3, Home, Plus, Minus, Trash2, Eye, TrendingUp, DollarSign, Package, Users, Settings, Edit, Save, X } from 'lucide-react';

const RestaurantApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [bills, setBills] = useState([]);
  const [menuItems, setMenuItems] = useState([
    { id: 1, name: 'ข้าวผัดกุ้ง', price: 60, category: 'ข้าว' },
    { id: 2, name: 'ข้าวผัดหมู', price: 50, category: 'ข้าว' },
    { id: 3, name: 'ผัดไทย', price: 45, category: 'เส้น' },
    { id: 4, name: 'ผัดซีอิ๊ว', price: 40, category: 'เส้น' },
    { id: 5, name: 'ต้มยำกุ้ง', price: 80, category: 'แกง' },
    { id: 6, name: 'แกงเขียวหวาน', price: 70, category: 'แกง' },
    { id: 7, name: 'โค้กเย็น', price: 20, category: 'เครื่องดื่ม' },
    { id: 8, name: 'น้ำเปล่า', price: 15, category: 'เครื่องดื่ม' }
  ]);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '' });
  const [shopSettings, setShopSettings] = useState({
    shopName: 'ร้านอาหารตามสั่ง',
    promptPayId: '0123456789',
    promptPayName: 'นายสมชาย ใจดี'
  });
  const [showSettingsForm, setShowSettingsForm] = useState(false);

  // คำนวณสถิติ
  const calculateStats = () => {
    const today = new Date().toDateString();
    const todayBills = bills.filter(bill => new Date(bill.date).toDateString() === today);
    const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.total, 0);
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
    
    // เมนูขายดี
    const itemSales = {};
    bills.forEach(bill => {
      bill.items.forEach(item => {
        itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
      });
    });
    
    const topItems = Object.entries(itemSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    return {
      todayRevenue,
      totalRevenue,
      todayOrders: todayBills.length,
      totalOrders: bills.length,
      topItems
    };
  };

  const stats = calculateStats();

  // เพิ่มรายการในออเดอร์
  const addToOrder = (item) => {
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

  // เพิ่มเมนูใหม่
  const addMenuItem = () => {
    if (!newItem.name || !newItem.price || !newItem.category) return;
    
    const nextId = Math.max(...menuItems.map(item => item.id)) + 1;
    const item = {
      id: nextId,
      name: newItem.name,
      price: parseInt(newItem.price),
      category: newItem.category
    };
    
    setMenuItems([...menuItems, item]);
    setNewItem({ name: '', price: '', category: '' });
    setShowAddForm(false);
  };

  // อัพเดทเมนู
  const updateMenuItem = (id, updatedItem) => {
    setMenuItems(menuItems.map(item =>
      item.id === id ? { ...item, ...updatedItem } : item
    ));
    setEditingItem(null);
  };

  // สร้าง QR Code PromptPay
  const generatePromptPayQR = (amount) => {
    // รูปแบบ QR Code สำหรับ PromptPay
    const promptPayId = shopSettings.promptPayId.replace(/-/g, '');
    const amountStr = amount.toFixed(2);
    
    // สร้าง QR Code Data
    const qrData = `00020101021129370016A000000677010111${promptPayId.padStart(13, '0')}54${amountStr}5802TH630${shopSettings.shopName}6304`;
    
    // สร้าง URL สำหรับ QR Code โดยใช้ qr-server
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  // อัพเดทจำนวนในออเดอร์
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
    } else {
      setCurrentOrder(currentOrder.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // ลบรายการจากออเดอร์
  const removeFromOrder = (itemId) => {
    setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
  };

  // คำนวณยอดรวม
  const calculateTotal = (orderItems) => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // ออกบิล
  const generateBill = () => {
    if (currentOrder.length === 0) return;
    
    const newBill = {
      id: bills.length + 1,
      date: new Date().toISOString(),
      items: currentOrder,
      total: calculateTotal(currentOrder),
      status: 'ชำระแล้ว'
    };
    
    setBills([...bills, newBill]);
    setCurrentOrder([]);
    setCurrentPage('bill');
  };

  // หน้าจัดการเมนู
  const MenuManagePage = () => (
    <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการเมนูอาหาร</h1>
        <div className="space-x-3">
          <button
            onClick={() => setShowSettingsForm(true)}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center space-x-2"
          >
            <Settings size={20} />
            <span>ตั้งค่าร้าน</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>เพิ่มเมนูใหม่</span>
          </button>
        </div>
      </div>

      {/* ฟอร์มตั้งค่าร้าน */}
      {showSettingsForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <h2 className="text-lg font-semibold mb-4">ตั้งค่าข้อมูลร้าน & PromptPay</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อร้าน</label>
              <input
                type="text"
                value={shopSettings.shopName}
                onChange={(e) => setShopSettings({ ...shopSettings, shopName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="ระบุชื่อร้าน"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขที่ PromptPay (เบอร์โทร หรือ เลขประจำตัว)
              </label>
              <input
                type="text"
                value={shopSettings.promptPayId}
                onChange={(e) => setShopSettings({ ...shopSettings, promptPayId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="เช่น 0812345678 หรือ 1234567890123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อเจ้าของบัญชี</label>
              <input
                type="text"
                value={shopSettings.promptPayName}
                onChange={(e) => setShopSettings({ ...shopSettings, promptPayName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="ระบุชื่อเจ้าของบัญชี"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowSettingsForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => setShowSettingsForm(false)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      )}

      {/* ฟอร์มเพิ่มเมนูใหม่ */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <h2 className="text-lg font-semibold mb-4">เพิ่มเมนูใหม่</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อเมนู</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ระบุชื่อเมนู"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ราคา</label>
              <input
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ระบุราคา"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">เลือกหมวดหมู่</option>
                <option value="ข้าว">ข้าว</option>
                <option value="เส้น">เส้น</option>
                <option value="แกง">แกง</option>
                <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                <option value="ของหวาน">ของหวาน</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewItem({ name: '', price: '', category: '' });
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={addMenuItem}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              เพิ่มเมนู
            </button>
          </div>
        </div>
      )}

      {/* รายการเมนู */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">รายการเมนูทั้งหมด</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {editingItem === item.id ? (
                  <MenuItemEditForm
                    item={item}
                    onSave={(updatedItem) => updateMenuItem(item.id, updatedItem)}
                    onCancel={() => setEditingItem(null)}
                  />
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-green-600 font-bold text-xl">₿{item.price}</p>
                        <p className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                          {item.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingItem(item.id)}
                        className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteMenuItem(item.id)}
                        className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // คอมโพเนนต์ฟอร์มแก้ไขเมนู
  const MenuItemEditForm = ({ item, onSave, onCancel }) => {
    const [editData, setEditData] = useState({
      name: item.name,
      price: item.price,
      category: item.category
    });

    const handleSave = () => {
      if (!editData.name || !editData.price || !editData.category) return;
      onSave({
        name: editData.name,
        price: parseInt(editData.price),
        category: editData.category
      });
    };

    return (
      <div className="space-y-3">
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="ชื่อเมนู"
        />
        <input
          type="number"
          value={editData.price}
          onChange={(e) => setEditData({ ...editData, price: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="ราคา"
        />
        <select
          value={editData.category}
          onChange={(e) => setEditData({ ...editData, category: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ข้าว">ข้าว</option>
          <option value="เส้น">เส้น</option>
          <option value="แกง">แกง</option>
          <option value="เครื่องดื่ม">เครื่องดื่ม</option>
          <option value="ของหวาน">ของหวาน</option>
          <option value="อื่นๆ">อื่นๆ</option>
        </select>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
          <button
            onClick={handleSave}
            className="bg-green-100 text-green-600 p-2 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Save size={16} />
          </button>
        </div>
      </div>
    );
  };
  const DashboardPage = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">แดชบอร์ดร้านอาหาร</h1>
      
      {/* สถิติหลัก */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">ยอดขายวันนี้</p>
              <p className="text-2xl font-bold text-blue-800">₿{stats.todayRevenue}</p>
            </div>
            <DollarSign className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">ยอดขายทั้งหมด</p>
              <p className="text-2xl font-bold text-green-800">₿{stats.totalRevenue}</p>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm">ออเดอร์วันนี้</p>
              <p className="text-2xl font-bold text-purple-800">{stats.todayOrders}</p>
            </div>
            <Package className="text-purple-500" size={24} />
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm">ออเดอร์ทั้งหมด</p>
              <p className="text-2xl font-bold text-orange-800">{stats.totalOrders}</p>
            </div>
            <Users className="text-orange-500" size={24} />
          </div>
        </div>
      </div>

      {/* เมนูขายดี */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">เมนูขายดี TOP 5</h2>
        <div className="space-y-3">
          {stats.topItems.map(([itemName, quantity], index) => (
            <div key={itemName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                  #{index + 1}
                </span>
                <span className="font-medium">{itemName}</span>
              </div>
              <span className="text-gray-600">{quantity} จาน</span>
            </div>
          ))}
        </div>
      </div>

      {/* รายการออเดอร์ล่าสุด */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">ออเดอร์ล่าสุด</h2>
        {bills.slice(-5).reverse().map(bill => (
          <div key={bill.id} className="flex justify-between items-center p-3 border-b last:border-b-0">
            <div>
              <p className="font-medium">บิลที่ #{bill.id}</p>
              <p className="text-sm text-gray-500">{new Date(bill.date).toLocaleString('th-TH')}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600">₿{bill.total}</p>
              <p className="text-sm text-gray-500">{bill.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // หน้าเพิ่มออเดอร์
  const OrderPage = () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">รับออเดอร์</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* เมนูอาหาร */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">เมนูอาหาร</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <span className="text-blue-600 font-semibold">₿{item.price}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{item.category}</p>
                <button
                  onClick={() => addToOrder(item)}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  เพิ่มลงออเดอร์
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ออเดอร์ปัจจุบัน */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">ออเดอร์ปัจจุบัน</h2>
          
          {currentOrder.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ยังไม่มีรายการในออเดอร์</p>
          ) : (
            <div className="space-y-3">
              {currentOrder.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500">₿{item.price} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="mx-2 font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-green-100 text-green-600 p-1 rounded hover:bg-green-200"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => removeFromOrder(item.id)}
                      className="bg-gray-100 text-red-600 p-1 rounded hover:bg-gray-200 ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>ยอดรวม:</span>
                  <span className="text-green-600">₿{calculateTotal(currentOrder)}</span>
                </div>
                <button
                  onClick={generateBill}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors mt-4"
                >
                  ออกบิล
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // หน้าบิล
  const BillPage = () => {
    const latestBill = bills[bills.length - 1];
    
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">ออกบิล</h1>
        
        {latestBill ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg border">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{shopSettings.shopName}</h2>
              <p className="text-gray-500">บิลเลขที่ #{latestBill.id}</p>
              <p className="text-sm text-gray-500">{new Date(latestBill.date).toLocaleString('th-TH')}</p>
            </div>
            
            <div className="space-y-2 mb-6">
              {latestBill.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₿{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>ยอดรวม:</span>
                <span className="text-green-600">₿{latestBill.total}</span>
              </div>
            </div>

            {/* QR Code PromptPay */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-center font-semibold text-blue-800 mb-3">
                💳 ชำระเงินผ่าน PromptPay
              </h3>
              <div className="flex justify-center mb-3">
                <img
                  src={generatePromptPayQR(latestBill.total)}
                  alt="PromptPay QR Code"
                  className="w-48 h-48 border-2 border-blue-200 rounded-lg"
                />
              </div>
              <div className="text-center text-sm text-blue-700">
                <p className="font-medium">{shopSettings.promptPayName}</p>
                <p>{shopSettings.promptPayId}</p>
                <p className="text-xs text-blue-600 mt-1">สแกน QR Code เพื่อชำระเงิน</p>
              </div>
            </div>

            <div className="text-center mb-4 text-sm text-gray-500">
              ขอบคุณที่ใช้บริการ
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                พิมพ์บิล
              </button>
              <button
                onClick={() => setCurrentPage('order')}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                รับออเดอร์ใหม่
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">ไม่มีบิลที่จะแสดง</p>
            <button
              onClick={() => setCurrentPage('order')}
              className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              รับออเดอร์
            </button>
          </div>
        )}
      </div>
    );
  };

  // หน้ารายงาน
  const ReportPage = () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">รายงานยอดขาย</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* สรุปยอดขาย */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">สรุปยอดขาย</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>ยอดขายวันนี้:</span>
              <span className="font-semibold text-green-600">₿{stats.todayRevenue}</span>
            </div>
            <div className="flex justify-between">
              <span>ออเดอร์วันนี้:</span>
              <span className="font-semibold">{stats.todayOrders} ออเดอร์</span>
            </div>
            <div className="flex justify-between">
              <span>ยอดขายรวม:</span>
              <span className="font-semibold text-blue-600">₿{stats.totalRevenue}</span>
            </div>
            <div className="flex justify-between">
              <span>ออเดอร์รวม:</span>
              <span className="font-semibold">{stats.totalOrders} ออเดอร์</span>
            </div>
          </div>
        </div>

        {/* รายการบิลทั้งหมด */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">รายการบิลทั้งหมด</h2>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {bills.length === 0 ? (
              <p className="text-gray-500 text-center">ยังไม่มีบิล</p>
            ) : (
              bills.slice().reverse().map(bill => (
                <div key={bill.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">บิล #{bill.id}</p>
                    <p className="text-xs text-gray-500">{new Date(bill.date).toLocaleString('th-TH')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₿{bill.total}</p>
                    <p className="text-xs text-gray-500">{bill.items.length} รายการ</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold text-gray-800">ระบบจัดการร้านอาหาร</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home size={20} />
                <span>แดชบอร์ด</span>
              </button>
              <button
                onClick={() => setCurrentPage('order')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'order'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart size={20} />
                <span>รับออเดอร์</span>
              </button>
              <button
                onClick={() => setCurrentPage('bill')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'bill'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Receipt size={20} />
                <span>บิล</span>
              </button>
              <button
                onClick={() => setCurrentPage('menu')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'menu'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings size={20} />
                <span>จัดการเมนู</span>
              </button>
              <button
                onClick={() => setCurrentPage('report')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'report'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 size={20} />
                <span>รายงาน</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'order' && <OrderPage />}
        {currentPage === 'bill' && <BillPage />}
        {currentPage === 'menu' && <MenuManagePage />}
        {currentPage === 'report' && <ReportPage />}
      </main>
    </div>
  );
};

export default RestaurantApp;