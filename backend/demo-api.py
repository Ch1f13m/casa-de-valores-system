"""
Simple API Gateway Demo - Casa de Valores
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse as urlparse

class APIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse.urlparse(self.path)
        
        # CORS headers
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        if parsed_path.path == '/':
            response = {
                "message": "Casa de Valores API Gateway",
                "version": "1.0.0",
                "status": "running"
            }
        elif parsed_path.path == '/health':
            response = {
                "status": "healthy",
                "services": {
                    "mysql": "connected",
                    "redis": "connected",
                    "mongodb": "connected",
                    "rabbitmq": "connected"
                }
            }
        elif parsed_path.path == '/api/users':
            response = {
                "users": [
                    {"id": "1", "username": "admin", "role": "admin"},
                    {"id": "2", "username": "broker1", "role": "broker"}
                ]
            }
        elif parsed_path.path == '/api/instruments':
            response = {
                "instruments": [
                    {"id": "1", "symbol": "AAPL", "name": "Apple Inc.", "price": 150.25},
                    {"id": "2", "symbol": "GOOGL", "name": "Alphabet Inc.", "price": 2800.75},
                    {"id": "3", "symbol": "MSFT", "name": "Microsoft Corporation", "price": 320.50}
                ]
            }
        else:
            response = {"error": "Endpoint not found"}
        
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8000), APIHandler)
    print("🏦 Casa de Valores API Gateway Demo")
    print("🚀 Server running on http://localhost:8000")
    print("📊 Available endpoints:")
    print("   - GET /health - Health check")
    print("   - GET /api/users - User list")
    print("   - GET /api/instruments - Financial instruments")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.server_close()