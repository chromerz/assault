import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('attachment downloader restricts destinations and detects HTTP failures and incomplete files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'assault-attachment-test-'));
  try {
    const source = join(dir, 'AttachmentDownloadTest.java');
    writeFileSync(source, `package app.assault.loader;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.security.cert.Certificate;
import javax.net.ssl.HttpsURLConnection;
public class AttachmentDownloadTest {
 static int code=200; static long length=3;
 static class Connection extends HttpsURLConnection {
  Connection(URL url){super(url);}
  public int getResponseCode(){if(getInstanceFollowRedirects())throw new AssertionError("redirects enabled");return code;}
  public long getContentLengthLong(){return length;}
  public InputStream getInputStream(){return new ByteArrayInputStream(new byte[]{1,2,3});}
  public void disconnect(){} public boolean usingProxy(){return false;} public void connect(){}
  public String getCipherSuite(){return "test";} public Certificate[] getLocalCertificates(){return null;} public Certificate[] getServerCertificates(){return null;}
 }
 static void rejected(String value)throws Exception {try{AttachmentDownload.allowedUrl(value);throw new AssertionError(value);}catch(IOException expected){}}
 public static void main(String[] args)throws Exception {
  URL.setURLStreamHandlerFactory(protocol->protocol.equals("https")?new URLStreamHandler(){protected URLConnection openConnection(URL u){return new Connection(u);}}:null);
  String good="https://cdn.discordapp.com/attachments/1/2/file.png?ex=signed";
  AttachmentDownload.allowedUrl(good);
  for(String bad:new String[]{"http://cdn.discordapp.com/attachments/x", "https://evil.example/attachments/x", "https://cdn.discordapp.com.evil.example/attachments/x", "https://user@cdn.discordapp.com/attachments/x", "https://cdn.discordapp.com:444/attachments/x", "https://cdn.discordapp.com/api/token", "file:///tmp/local"})rejected(bad);
  File file=new File(args[0]);AttachmentDownload.fetch(good,file);if(file.length()!=3)throw new AssertionError();
  for(int status:new int[]{302,403,429}){code=status;try{AttachmentDownload.fetch(good,file);throw new AssertionError();}catch(IOException expected){if(!expected.getMessage().equals("HTTP "+status))throw expected;}}
  try{AttachmentDownload.fetch(good,file,()->true);throw new AssertionError();}catch(IOException expected){}
  code=200;length=4;try{AttachmentDownload.fetch(good,file);throw new AssertionError();}catch(IOException expected){if(!expected.getMessage().equals("Incomplete attachment response"))throw expected;}
 }
}`);
    execFileSync('javac', ['-d', dir, resolve('android/loader/src/main/java/app/assault/loader/AttachmentDownload.java'), source]);
    execFileSync('java', ['-cp', dir, 'app.assault.loader.AttachmentDownloadTest', join(dir, 'download.bin')]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
