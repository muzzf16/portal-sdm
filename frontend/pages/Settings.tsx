import React, { useState, useEffect } from 'react';
import { PageTitle, Card, Input } from '../components/ui';
import { Button } from 'react-bootstrap';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

interface Holiday {
    date: string;
    description: string;
}

const SettingsPage = () => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState<{ [key: string]: string }>({
        defaultClockIn: '00:00',
        defaultClockOut: '00:00',
    });
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [newHoliday, setNewHoliday] = useState({ date: '', description: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [settingsData, holidaysData] = await Promise.all([
                api.getSettings(),
                api.getHolidays(),
            ]);
            setSettings(settingsData);
            setHolidays(holidaysData);
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Gagal memuat data pengaturan', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSettings = async () => {
        try {
            await api.updateSettings(settings);
            addToast('Pengaturan jam kerja berhasil disimpan', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan', 'error');
        }
    };

    const handleNewHolidayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewHoliday(prev => ({ ...prev, [name]: value }));
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHoliday.date || !newHoliday.description) {
            addToast('Tanggal dan deskripsi harus diisi', 'warning');
            return;
        }
        try {
            await api.addHoliday(newHoliday);
            addToast('Cuti bersama berhasil ditambahkan', 'success');
            setNewHoliday({ date: '', description: '' });
            fetchData(); // Refresh data
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Gagal menambah cuti bersama', 'error');
        }
    };

    const handleDeleteHoliday = async (date: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus libur pada tanggal ${date}?`)) {
            return;
        }
        try {
            await api.deleteHoliday(date);
            addToast('Cuti bersama berhasil dihapus', 'success');
            fetchData(); // Refresh data
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Gagal menghapus cuti bersama', 'error');
        }
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = async () => {
        if (!logoFile) {
            addToast('Pilih file logo terlebih dahulu', 'warning');
            return;
        }
        try {
            await api.uploadCompanyLogo(logoFile);
            addToast('Logo perusahaan berhasil diunggah. Refresh halaman untuk melihat perubahan.', 'success');
            setLogoFile(null);
            setLogoPreview(null);
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Gagal mengunggah logo', 'error');
        }
    };

    if (isLoading) {
        return <PageTitle title="Pengaturan" />;
    }

    return (
        <div>
            <PageTitle title="Pengaturan" />

            <Card className="mb-4">
                <h3 className="card-title h5">Logo Perusahaan</h3>
                <p className="card-text text-muted">Unggah logo perusahaan yang akan ditampilkan di sidebar.</p>
                <div className="d-flex align-items-center gap-4">
                    <div>
                        <p className="text-muted small mb-1">Logo Saat Ini</p>
                        <img src="/uploads/company-logo.png" alt="Company Logo" style={{ height: '64px', width: 'auto' }} onError={(e) => e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'} />
                    </div>
                    {logoPreview && (
                        <div>
                            <p className="text-muted small mb-1">Pratinjau Logo Baru</p>
                            <img src={logoPreview} alt="New Logo Preview" style={{ height: '64px', width: 'auto', border: '2px dashed #0d6efd' }} />
                        </div>
                    )}
                </div>
                <div className="mt-3">
                    <Input
                        label="Pilih File Logo"
                        type="file"
                        name="logo"
                        onChange={handleLogoFileChange}
                        accept="image/png, image/jpeg, image/svg+xml"
                    />
                </div>
                <div className="mt-3">
                    <Button onClick={handleLogoUpload} disabled={!logoFile}>Unggah & Simpan Logo</Button>
                </div>
            </Card>

            <Card className="mb-4">
                <h3 className="card-title h5">Pengaturan Jam Kerja</h3>
                <p className="card-text text-muted">Atur jam masuk dan keluar default untuk perhitungan keterlambatan.</p>
                <div className="row g-3">
                    <div className="col-md-6">
                        <Input
                            label="Jam Masuk Default"
                            type="time"
                            name="defaultClockIn"
                            value={settings.defaultClockIn || ''}
                            onChange={handleSettingsChange}
                        />
                    </div>
                    <div className="col-md-6">
                        <Input
                            label="Jam Keluar Default"
                            type="time"
                            name="defaultClockOut"
                            value={settings.defaultClockOut || ''}
                            onChange={handleSettingsChange}
                        />
                    </div>
                </div>
                <div className="mt-3">
                    <Button onClick={handleSaveSettings}>Simpan Pengaturan Jam</Button>
                </div>
            </Card>

            <Card>
                <h3 className="card-title h5">Pengelolaan Cuti Bersama</h3>
                <p className="card-text text-muted">Tambah atau hapus tanggal yang ditetapkan sebagai cuti bersama nasional.</p>
                
                <form className="row g-3 mb-4 align-items-end" onSubmit={handleAddHoliday}>
                    <div className="col-md-4">
                        <Input
                            label="Tanggal"
                            type="date"
                            name="date"
                            value={newHoliday.date}
                            onChange={handleNewHolidayChange}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <Input
                            label="Deskripsi"
                            name="description"
                            value={newHoliday.description}
                            onChange={handleNewHolidayChange}
                            placeholder="Contoh: Cuti Bersama Idul Fitri"
                            required
                        />
                    </div>
                    <div className="col-md-2">
                        <Button type="submit" className="w-100">Tambah</Button>
                    </div>
                </form>

                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead className="table-light">
                            <tr>
                                <th scope="col">Tanggal</th>
                                <th scope="col">Deskripsi</th>
                                <th scope="col" className="text-end">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holidays.map(holiday => (
                                <tr key={holiday.date}>
                                    <td>{holiday.date}</td>
                                    <td>{holiday.description}</td>
                                    <td className="text-end">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDeleteHoliday(holiday.date)}
                                        >
                                            Hapus
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {holidays.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center text-muted p-4">
                                        Belum ada data cuti bersama.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;