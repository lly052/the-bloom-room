import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download, Trash2, Upload, File, Lock } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

type StoredFile = {
  name: string;
  size: number;
  mimetype: string;
  createdAt: string;
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function FilesTab() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const [pendingFileExtension, setPendingFileExtension] = useState('');

  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [newFilePassword, setNewFilePassword] = useState('');
  const [confirmNewFilePassword, setConfirmNewFilePassword] = useState('');
  const [protectedFiles, setProtectedFiles] = useState<Set<string>>(new Set());

  const [fileRequiringPassword, setFileRequiringPassword] = useState<string | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [deleteTargetName, setDeleteTargetName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
    loadProtectedFiles();
  }, []);

  async function loadFiles() {
    setIsLoading(true);
    const { data, error } = await supabase.storage
      .from('files')
      .list('', { sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      setErrorMessage('Could not load files. Please check your Supabase Storage setup.');
    } else if (data) {
      const realFiles = data.filter(item => item.name !== '.emptyFolderPlaceholder');
      setFiles(realFiles.map(item => ({
        name: item.name,
        size: item.metadata?.size ?? 0,
        mimetype: item.metadata?.mimetype ?? 'application/octet-stream',
        createdAt: item.created_at ?? '',
      })));
    }
    setIsLoading(false);
  }

  async function loadProtectedFiles() {
    const { data, error } = await supabase.from('file_passwords').select('file_name');
    if (!error && data) {
      setProtectedFiles(new Set(data.map(row => row.file_name)));
    }
  }

  function handleUploadButtonClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const lastDotIndex = file.name.lastIndexOf('.');
    const nameWithoutExtension = lastDotIndex > 0 ? file.name.slice(0, lastDotIndex) : file.name;
    const extension = lastDotIndex > 0 ? file.name.slice(lastDotIndex) : '';

    setPendingFile(file);
    setPendingFileName(nameWithoutExtension);
    setPendingFileExtension(extension);
    setIsPasswordProtected(false);
    setNewFilePassword('');
    setConfirmNewFilePassword('');
    setErrorMessage('');
    e.target.value = '';
  }

  async function handleConfirmUpload() {
    if (!pendingFile) return;

    if (isPasswordProtected) {
      if (newFilePassword.length < 4) { setErrorMessage('Password must be at least 4 characters.'); return; }
      if (newFilePassword !== confirmNewFilePassword) { setErrorMessage('Passwords do not match. Please try again.'); return; }
    }

    setIsUploading(true);
    setErrorMessage('');

    const chosenName = pendingFileName.trim() || 'untitled';
    const uniqueFileName = `${Date.now()}-${chosenName}${pendingFileExtension}`;

    const { error: uploadError } = await supabase.storage.from('files').upload(uniqueFileName, pendingFile);

    if (uploadError) {
      setErrorMessage(`Upload failed: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    if (isPasswordProtected && newFilePassword) {
      const hash = await hashPassword(newFilePassword);
      const { error: passwordError } = await supabase
        .from('file_passwords')
        .insert({ file_name: uniqueFileName, password_hash: hash });

      if (passwordError) {
        setErrorMessage('File uploaded but password could not be saved. Try again.');
        setIsUploading(false);
        return;
      }
      setProtectedFiles(prev => new Set([...prev, uniqueFileName]));
    }

    await loadFiles();
    setPendingFile(null);
    setPendingFileName('');
    setPendingFileExtension('');
    setIsPasswordProtected(false);
    setNewFilePassword('');
    setConfirmNewFilePassword('');
    setIsUploading(false);
  }

  function handleCancelUpload() {
    setPendingFile(null);
    setPendingFileName('');
    setPendingFileExtension('');
    setIsPasswordProtected(false);
    setNewFilePassword('');
    setConfirmNewFilePassword('');
    setErrorMessage('');
  }

  function handleOpenFile(fileName: string) {
    if (protectedFiles.has(fileName)) {
      setFileRequiringPassword(fileName);
      setEnteredPassword('');
      setPasswordError('');
    } else {
      openFileWithSignedUrl(fileName);
    }
  }

  async function handlePasswordSubmit() {
    if (!fileRequiringPassword) return;

    const newTab = window.open('', '_blank');
    setIsCheckingPassword(true);
    setPasswordError('');

    const hashedInput = await hashPassword(enteredPassword);
    const { data, error } = await supabase
      .from('file_passwords')
      .select('password_hash')
      .eq('file_name', fileRequiringPassword)
      .single();

    setIsCheckingPassword(false);

    if (error || !data) {
      newTab?.close();
      setPasswordError('Could not check the password. Please try again.');
      return;
    }

    if (hashedInput !== data.password_hash) {
      newTab?.close();
      setPasswordError('Incorrect password. Please try again.');
      return;
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from('files')
      .createSignedUrl(fileRequiringPassword, 60);

    if (urlError || !urlData) {
      newTab?.close();
      setPasswordError('Could not open the file. Please try again.');
      return;
    }

    if (newTab) newTab.location.href = urlData.signedUrl;
    setFileRequiringPassword(null);
    setEnteredPassword('');
  }

  function handleCancelPasswordPrompt() {
    setFileRequiringPassword(null);
    setEnteredPassword('');
    setPasswordError('');
  }

  async function openFileWithSignedUrl(fileName: string) {
    const newTab = window.open('', '_blank');
    const { data, error } = await supabase.storage.from('files').createSignedUrl(fileName, 60);

    if (error || !data) {
      newTab?.close();
      setErrorMessage('Could not open the file. Please try again.');
    } else {
      if (newTab) newTab.location.href = data.signedUrl;
    }
  }

  async function handleDeleteFile(fileName: string) {
    const { error } = await supabase.storage.from('files').remove([fileName]);

    if (error) { setErrorMessage('Could not delete the file. Please try again.'); return; }

    if (protectedFiles.has(fileName)) {
      await supabase.from('file_passwords').delete().eq('file_name', fileName);
      setProtectedFiles(prev => {
        const updated = new Set(prev);
        updated.delete(fileName);
        return updated;
      });
    }

    setFiles(prev => prev.filter(f => f.name !== fileName));
  }

  function getDisplayName(fileName: string): string {
    return fileName.replace(/^\d+-/, '');
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileTypeLabel(mimetype: string): string {
    if (mimetype.includes('pdf')) return 'PDF';
    if (mimetype.includes('image')) return 'Image';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'Word Doc';
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'Spreadsheet';
    if (mimetype.includes('text')) return 'Text File';
    return 'File';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Files</CardTitle>
              <CardDescription>Upload and manage your documents and files</CardDescription>
            </div>
            {!pendingFile && (
              <Button onClick={handleUploadButtonClick}>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelected} />

          {pendingFile && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-800 mb-1">Name your file</p>
                <p className="text-xs text-slate-500 mb-3">You can rename it before uploading. The extension is kept automatically.</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pendingFileName}
                    onChange={(e) => setPendingFileName(e.target.value)}
                    autoFocus
                    placeholder="Enter a file name"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  {pendingFileExtension && (
                    <span className="text-sm text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2 shrink-0">
                      {pendingFileExtension}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPasswordProtected}
                    onChange={(e) => setIsPasswordProtected(e.target.checked)}
                    className="w-4 h-4 accent-slate-800"
                  />
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700">Password protect this file</span>
                </label>
              </div>

              {isPasswordProtected && (
                <div className="space-y-3 pl-6 border-l-2 border-slate-200">
                  <p className="text-xs text-slate-500">Anyone who tries to open this file will need to enter this password.</p>
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-600">Password</label>
                    <input
                      type="password"
                      value={newFilePassword}
                      onChange={(e) => setNewFilePassword(e.target.value)}
                      placeholder="At least 4 characters"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-600">Confirm password</label>
                    <input
                      type="password"
                      value={confirmNewFilePassword}
                      onChange={(e) => setConfirmNewFilePassword(e.target.value)}
                      placeholder="Type it again"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errorMessage}</div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleConfirmUpload} disabled={isUploading} size="sm">
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button onClick={handleCancelUpload} variant="outline" size="sm" disabled={isUploading}>Cancel</Button>
              </div>
            </div>
          )}

          {fileRequiringPassword && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-medium text-slate-800">This file is password protected</p>
              </div>
              <p className="text-xs text-slate-600">
                Enter the password to open <span className="font-medium">{getDisplayName(fileRequiringPassword)}</span>
              </p>
              <input
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter password"
                autoFocus
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              <div className="flex gap-2">
                <Button onClick={handlePasswordSubmit} disabled={isCheckingPassword} size="sm">
                  {isCheckingPassword ? 'Checking...' : 'Open File'}
                </Button>
                <Button onClick={handleCancelPasswordPrompt} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          )}

          {errorMessage && !pendingFile && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{errorMessage}</div>
          )}

          {!isLoading && files.length > 0 && (
            <p className="text-sm text-slate-500 mb-4">{files.length} {files.length === 1 ? 'file' : 'files'}</p>
          )}

          {isLoading && <div className="text-center text-slate-500 py-12">Loading files...</div>}

          {!isLoading && files.length === 0 && !pendingFile && (
            <div className="text-center text-slate-400 py-16">
              <File className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-600">No files uploaded yet</p>
              <p className="text-sm mt-1">Click "Upload File" to add your first document</p>
            </div>
          )}

          {!isLoading && files.length > 0 && (
            <div className="divide-y divide-slate-100">
              {files.map((file) => {
                const isProtected = protectedFiles.has(file.name);
                return (
                  <div key={file.name} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-8 h-8 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-slate-900 truncate">{getDisplayName(file.name)}</p>
                          {isProtected && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {getFileTypeLabel(file.mimetype)} · {formatFileSize(file.size)}
                          {file.createdAt && <> · {new Date(file.createdAt).toLocaleDateString()}</>}
                          {isProtected && <span className="ml-1 text-amber-600"> · Password protected</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleOpenFile(file.name)}>
                        {isProtected
                          ? <><Lock className="w-3.5 h-3.5 mr-1" />Open</>
                          : <><Download className="w-4 h-4 mr-1" />Open</>}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTargetName(file.name)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={deleteTargetName !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetName(null); }}
        title="Delete File"
        description={`Are you sure you want to delete "${deleteTargetName ? getDisplayName(deleteTargetName) : ''}"? This cannot be undone.`}
        onConfirm={() => { if (deleteTargetName) handleDeleteFile(deleteTargetName); }}
      />
    </div>
  );
}
