<?php
/**
 * Agora Cloud Recording API Endpoint
 * Bu dosya Agora Cloud Recording işlemlerini yönetir
 * 
 * Kullanım:
 * POST /recording.php
 * 
 * Parametreler:
 * - action: start, stop, query, list, download
 * - recordingId: Recording ID (stop, query için)
 * - fileId: Dosya ID (download için)
 * - Diğer recording konfigürasyon parametreleri
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS request için CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Sadece POST isteklerini kabul et
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// JSON input'u al
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit();
}

// Gerekli parametreleri kontrol et
if (!isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Action parameter is required']);
    exit();
}

// Agora konfigürasyonu
$agoraConfig = [
    'appId' => 'YOUR_AGORA_APP_ID',
    'appCertificate' => 'YOUR_AGORA_APP_CERTIFICATE',
    'customerId' => 'YOUR_CUSTOMER_ID',
    'customerSecret' => 'YOUR_CUSTOMER_SECRET',
    'recordingApiUrl' => 'https://api.agora.io/v1/apps/',
    'recordingApiVersion' => 'v1'
];

try {
    $action = $input['action'];
    
    switch ($action) {
        case 'start':
            $result = startRecording($input, $agoraConfig);
            break;
            
        case 'stop':
            $result = stopRecording($input, $agoraConfig);
            break;
            
        case 'query':
            $result = queryRecording($input, $agoraConfig);
            break;
            
        case 'list':
            $result = listRecordings($agoraConfig);
            break;
            
        case 'download':
            $result = downloadRecording($input, $agoraConfig);
            break;
            
        default:
            throw new Exception('Invalid action: ' . $action);
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'success' => false
    ]);
}

/**
 * Recording başlatma
 */
function startRecording($input, $config) {
    // Gerekli parametreleri kontrol et
    if (!isset($input['channelName'])) {
        throw new Exception('Channel name is required');
    }
    
    $channelName = $input['channelName'];
    $uid = $input['uid'] ?? 0;
    
    // Recording konfigürasyonu
    $recordingConfig = [
        'maxIdleTime' => $input['maxIdleTime'] ?? 30,
        'streamTypes' => $input['streamTypes'] ?? 2, // Audio + Video
        'channelType' => $input['channelType'] ?? 1, // Live streaming
        'subscribeAudioUids' => $input['subscribeAudioUids'] ?? [],
        'subscribeVideoUids' => $input['subscribeVideoUids'] ?? [],
        'subscribeUidGroup' => $input['subscribeUidGroup'] ?? 0,
        'recordingFileConfig' => [
            'avFileType' => ['hls', 'mp4'],
            'fileCompress' => false,
            'fileMaxSizeMB' => 512
        ],
        'storageConfig' => [
            'vendor' => 0, // Agora Cloud Storage
            'region' => 0, // Global
            'bucket' => 'agora-recording-bucket',
            'accessKey' => $config['customerId'],
            'secretKey' => $config['customerSecret']
        ]
    ];
    
    // Agora API'ye istek gönder
    $apiUrl = $config['recordingApiUrl'] . $config['appId'] . '/cloud_recording/acquire';
    
    $requestData = [
        'cname' => $channelName,
        'uid' => $uid,
        'clientRequest' => [
            'resourceExpiredHour' => 24
        ]
    ];
    
    $response = makeAgoraRequest($apiUrl, $requestData, $config);
    
    if (isset($response['resourceId'])) {
        $resourceId = $response['resourceId'];
        
        // Recording başlat
        $startUrl = $config['recordingApiUrl'] . $config['appId'] . '/cloud_recording/resource/' . $resourceId . '/mode/mix/start';
        
        $startData = [
            'cname' => $channelName,
            'uid' => $uid,
            'clientRequest' => $recordingConfig
        ];
        
        $startResponse = makeAgoraRequest($startUrl, $startData, $config);
        
        if (isset($startResponse['sid'])) {
            return [
                'success' => true,
                'recordingId' => $startResponse['sid'],
                'resourceId' => $resourceId,
                'message' => 'Recording started successfully'
            ];
        } else {
            throw new Exception('Failed to start recording: ' . json_encode($startResponse));
        }
    } else {
        throw new Exception('Failed to acquire resource: ' . json_encode($response));
    }
}

/**
 * Recording durdurma
 */
function stopRecording($input, $config) {
    if (!isset($input['recordingId'])) {
        throw new Exception('Recording ID is required');
    }
    
    $recordingId = $input['recordingId'];
    $channelName = $input['channelName'] ?? '';
    $uid = $input['uid'] ?? 0;
    
    // Recording durdur
    $stopUrl = $config['recordingApiUrl'] . $config['appId'] . '/cloud_recording/resource/' . $recordingId . '/sid/' . $recordingId . '/mode/mix/stop';
    
    $stopData = [
        'cname' => $channelName,
        'uid' => $uid,
        'clientRequest' => [
            'async_stop' => false
        ]
    ];
    
    $response = makeAgoraRequest($stopUrl, $stopData, $config);
    
    if (isset($response['fileList'])) {
        return [
            'success' => true,
            'files' => $response['fileList'],
            'message' => 'Recording stopped successfully'
        ];
    } else {
        throw new Exception('Failed to stop recording: ' . json_encode($response));
    }
}

/**
 * Recording durumu sorgulama
 */
function queryRecording($input, $config) {
    if (!isset($input['recordingId'])) {
        throw new Exception('Recording ID is required');
    }
    
    $recordingId = $input['recordingId'];
    $channelName = $input['channelName'] ?? '';
    $uid = $input['uid'] ?? 0;
    
    // Recording durumunu sorgula
    $queryUrl = $config['recordingApiUrl'] . $config['appId'] . '/cloud_recording/resource/' . $recordingId . '/sid/' . $recordingId . '/mode/mix/query';
    
    $queryData = [
        'cname' => $channelName,
        'uid' => $uid
    ];
    
    $response = makeAgoraRequest($queryUrl, $queryData, $config);
    
    if (isset($response['status'])) {
        return [
            'success' => true,
            'status' => $response['status'],
            'isRecording' => $response['status'] === 1,
            'files' => $response['fileList'] ?? []
        ];
    } else {
        throw new Exception('Failed to query recording: ' . json_encode($response));
    }
}

/**
 * Recording dosyalarını listele
 */
function listRecordings($config) {
    // Bu fonksiyon tüm recording'leri listeler
    // Gerçek implementasyonda veritabanından çekilir
    
    $recordings = [
        [
            'fileId' => 'recording_001',
            'fileName' => 'meeting_2024_01_15.mp4',
            'fileSize' => 1024000,
            'duration' => 3600,
            'createdAt' => '2024-01-15T10:00:00Z',
            'downloadUrl' => 'https://example.com/download/recording_001'
        ],
        [
            'fileId' => 'recording_002',
            'fileName' => 'meeting_2024_01_16.mp4',
            'fileSize' => 2048000,
            'duration' => 7200,
            'createdAt' => '2024-01-16T14:30:00Z',
            'downloadUrl' => 'https://example.com/download/recording_002'
        ]
    ];
    
    return [
        'success' => true,
        'files' => $recordings
    ];
}

/**
 * Recording dosyasını indir
 */
function downloadRecording($input, $config) {
    if (!isset($input['fileId'])) {
        throw new Exception('File ID is required');
    }
    
    $fileId = $input['fileId'];
    
    // Gerçek implementasyonda dosya URL'si veritabanından çekilir
    $downloadUrl = 'https://example.com/download/' . $fileId;
    $fileName = 'recording_' . $fileId . '.mp4';
    
    return [
        'success' => true,
        'downloadUrl' => $downloadUrl,
        'fileName' => $fileName
    ];
}

/**
 * Agora API isteği gönder
 */
function makeAgoraRequest($url, $data, $config) {
    $headers = [
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode($config['customerId'] . ':' . $config['customerSecret'])
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception('cURL error: ' . $error);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('HTTP error: ' . $httpCode . ' - ' . $response);
    }
    
    $result = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON response: ' . $response);
    }
    
    return $result;
}

/**
 * Log fonksiyonu
 */
function logMessage($message, $level = 'INFO') {
    $logFile = 'recording_api.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}
?> 