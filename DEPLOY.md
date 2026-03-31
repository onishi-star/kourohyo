# GitHub Pages デプロイ手順

## 方法1：GitHubリポジトリを作成してデプロイ

1. GitHubで新しいリポジトリを作成
2. 以下のコマンドでリポジトリを初期化：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repository-name.git
git push -u origin main
```

3. GitHubでSettings → Pagesに移動
4. Sourceを「Deploy from a branch」に設定
5. Branchを「main」に設定
6. Saveしてデプロイ完了

## 方法2：Firebase CLIを使用（Node.jsが必要）

1. Node.jsをインストール：https://nodejs.org/
2. Firebase CLIをインストール：
```bash
npm install -g firebase-tools
```

3. Firebaseにログイン：
```bash
firebase login
```

4. デプロイ：
```bash
firebase deploy
```

## 推奨

GitHub Pagesが最も簡単で無料で利用できます。Firebase Hostingはより高度な機能を提供しますが、Node.jsのセットアップが必要です。
