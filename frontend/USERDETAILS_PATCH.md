# UserDetailsPage.tsx Updates

## 1. Add Warning Event Listener (around line 169-177)

Find this code:
```typescript
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
```

Replace with:
```typescript
    const handleWarningCreated = (e: any) => {
      if (e.detail?.userId === userId) {
        console.log('Warning created for this user, refreshing data...');
        fetchUserDetails();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('warningCreated', handleWarningCreated);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('warningCreated', handleWarningCreated);
    };
```

## 2. Add Document Display in Warnings Tab (around line 1118-1127)

Find this code (inside the warnings.map loop):
```typescript
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Issued: {formatDate(warning.issuedAt)}</span>
                          {warning.resolvedAt && (
                            <span>Resolved: {formatDate(warning.resolvedAt)}</span>
                          )}
                          <Badge className={getStatusColor(warning.status)}>
                            {warning.status}
                          </Badge>
                        </div>
```

Add AFTER this div (before </Card>):
```typescript
                        {warning.metadata?.attachmentUrl && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <a 
                              href={`http://localhost:3001${warning.metadata.attachmentUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              View Attachment
                            </a>
                          </div>
                        )}
```

## 3. Import FileText Icon (around line 6)

Find this line:
```typescript
import { ArrowLeft, User, Mail, Phone, Clock, CheckCircle, Play, FileQuestion, Target, TrendingUp, AlertTriangle, BarChart3, Download, FileText, Award, XCircle } from 'lucide-react';
```

FileText should already be imported. If not, add it to the imports.
