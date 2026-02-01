# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Black Duck MCP Server.

## Table of Contents
- [Authentication Issues](#authentication-issues)
- [Connection Problems](#connection-problems)
- [Project Access Issues](#project-access-issues)
- [Rate Limiting](#rate-limiting)
- [Timeout Errors](#timeout-errors)
- [MCP Client Integration Issues](#mcp-client-integration-issues)

---

## Authentication Issues

### Error: "Authentication failed. Please check your API token."

**Possible Causes:**
- Invalid or expired API token
- Incorrect token format
- Insufficient token permissions

**Solutions:**

1. **Verify Token Format**
   - Token should be a long alphanumeric string
   - No extra spaces or quotes around the token
   - Check that it's properly set in your `.env` or Claude Desktop config

2. **Check Token Validity in Black Duck**
   - Log into your Black Duck server
   - Navigate to your user profile (top right corner)
   - Go to "My Access Tokens"
   - Verify the token exists and hasn't expired
   - Check the expiration date

3. **Verify Token Permissions**
   - Token needs at least read access to projects
   - For remediation features, write access is required
   - Contact your Black Duck administrator if permissions are insufficient

4. **Generate New Token**
   - In Black Duck, go to "My Access Tokens"
   - Create a new token with appropriate permissions
   - Update your `.env` file or Claude Desktop config
   - Restart the MCP server or Claude Desktop

### Error: "Authorization header missing or invalid"

**Solution:**
- Ensure `BLACK_DUCK_API_TOKEN` is set in your environment
- Check that the token is being passed to the MCP server
- Verify your MCP client configuration includes the token in the `env` section

---

## Connection Problems

### Error: "Cannot connect to Black Duck server"

**Possible Causes:**
- Incorrect Black Duck URL
- Network connectivity issues
- Firewall blocking connections
- Black Duck server is down

**Solutions:**

1. **Verify Black Duck URL**
   ```bash
   # Your URL should look like:
   BLACK_DUCK_URL=https://blackduck.yourcompany.com

   # NOT:
   BLACK_DUCK_URL=https://blackduck.yourcompany.com/  # (no trailing slash)
   BLACK_DUCK_URL=http://blackduck.yourcompany.com    # (should be https)
   ```

2. **Test Network Connectivity**
   ```bash
   # Try to reach the Black Duck server
   curl https://your-blackduck-server.com/api/current-version
   ```

3. **Check Firewall Rules**
   - Ensure your firewall allows HTTPS (port 443) to Black Duck server
   - If behind corporate proxy, configure proxy settings
   - Contact your network administrator if needed

4. **Verify Black Duck Server Status**
   - Try accessing Black Duck web interface in a browser
   - Check with your Black Duck administrator about server status
   - Look for scheduled maintenance windows

### Error: "SSL/TLS Certificate Error"

**Solutions:**

1. **For Self-Signed Certificates (Development Only)**
   - Not recommended for production
   - Contact your security team for proper certificate setup

2. **For Certificate Issues**
   - Ensure your system trusts the Black Duck server's certificate
   - Update CA certificates on your system
   - Contact your IT security team

---

## Project Access Issues

### Error: "Project with ID 'xxx' not found"

**Possible Causes:**
- Incorrect project ID
- Project doesn't exist
- Insufficient permissions to access the project
- Project was deleted

**Solutions:**

1. **Find Correct Project ID**
   ```
   # Use the MCP tool to search by name
   Find project named "YourProjectName"
   ```

2. **Verify Project Exists**
   - Log into Black Duck web interface
   - Navigate to Projects
   - Confirm the project is visible
   - Check project name spelling

3. **Check Permissions**
   - Verify your user account has access to the project
   - Contact Black Duck administrator to grant access
   - Ensure your API token has appropriate scope

### Error: "No projects found"

**Possible Causes:**
- No projects exist in Black Duck
- User doesn't have access to any projects
- Token has insufficient permissions

**Solutions:**
- Contact your Black Duck administrator to grant project access
- Verify projects exist in Black Duck web interface
- Check API token permissions

---

## Rate Limiting

### Error: "Rate limit exceeded"

**Cause:**
- Black Duck API has rate limits per user/token
- Too many requests in a short time period

**Solutions:**

1. **Wait Before Retrying**
   - Wait 60 seconds before making more requests
   - Black Duck rate limits are typically time-based

2. **Reduce Request Frequency**
   - Use pagination with smaller limits
   - Cache results when possible
   - Batch operations instead of individual requests

3. **Contact Administrator**
   - Rate limits may be configurable
   - Your organization may need higher limits
   - Consider dedicated service account with higher limits

---

## Timeout Errors

### Error: "Request to Black Duck server timed out"

**Possible Causes:**
- Black Duck server is slow or overloaded
- Large dataset being retrieved
- Network latency issues
- Default timeout too short

**Solutions:**

1. **Increase Timeout (if supported)**
   - Add to `.env` file:
   ```bash
   BLACK_DUCK_TIMEOUT=60000  # 60 seconds (default is 30000)
   ```

2. **Reduce Result Size**
   - Use smaller pagination limits
   - Filter results by severity
   - Search for specific components or vulnerabilities

3. **Check Black Duck Server Performance**
   - Contact Black Duck administrator
   - Check if server is experiencing high load
   - Consider off-peak hours for large queries

4. **Network Optimization**
   - Test network latency to Black Duck server
   - Use wired connection instead of WiFi if possible
   - Contact network administrator about latency issues

---

## MCP Client Integration Issues

### MCP Server Not Appearing in Claude Desktop

**Solutions:**

1. **Verify Configuration File Location**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Check JSON Syntax**
   - Ensure valid JSON format
   - No trailing commas
   - Proper quote usage
   - Use a JSON validator if needed

3. **Verify Absolute Path**
   ```json
   {
     "mcpServers": {
       "blackduck": {
         "command": "node",
         "args": [
           "/full/absolute/path/to/black_duck_mcp/dist/index.js"
         ],
         "env": {
           "BLACK_DUCK_URL": "https://your-server.com",
           "BLACK_DUCK_API_TOKEN": "your-token"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**
   - Completely quit Claude Desktop (not just close window)
   - Start Claude Desktop again
   - Wait a few seconds for MCP servers to initialize

5. **Check Build Status**
   ```bash
   cd /path/to/black_duck_mcp
   npm run build
   # Verify dist/index.js exists
   ```

### Error: "MCP server crashed" or "Connection lost"

**Solutions:**

1. **Check Server Logs**
   - Look for error messages in terminal/console
   - Check Node.js version compatibility (requires 18.x+)

2. **Test Server Directly**
   ```bash
   cd /path/to/black_duck_mcp
   npm start
   # Should not crash immediately
   ```

3. **Verify Environment Variables**
   - Ensure `BLACK_DUCK_URL` and `BLACK_DUCK_API_TOKEN` are set
   - Check for typos in environment variable names

4. **Reinstall Dependencies**
   ```bash
   cd /path/to/black_duck_mcp
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

---

## Getting Additional Help

If you continue to experience issues:

1. **Check Logs**
   - Review console output from the MCP server
   - Check Claude Desktop logs (if applicable)
   - Look for specific error messages

2. **Verify Prerequisites**
   - Node.js 18.x or higher: `node --version`
   - Black Duck server is accessible
   - Valid API token

3. **Minimal Test**
   - Try the simplest operation first (e.g., list projects)
   - Gradually test more complex operations
   - Isolate the specific operation causing issues

4. **Collect Information**
   - Error messages (exact text)
   - Black Duck server version
   - Node.js version
   - Operating system
   - Steps to reproduce

5. **Contact Support**
   - Open an issue on the project repository
   - Include all collected information
   - Sanitize any sensitive data (tokens, URLs)
   - Provide reproducible test case if possible
