// lang/ja.js
const ja = {
    // Block page
    block: {
        title: "このサイトはブロック対象です。",
        message: "このサイト訪問は<br>本当に必要ですか?",
        titleReturn: "また戻ってきましたね。",
        messageReturn: "もう一度考えてみませんか?<br>本当に必要な訪問ですか?",
        titleMultiple: "今日{count}回目の訪問です。",
        messageMultiple1: "少し休憩しませんか?<br>集中力を取り戻しましょう。",
        messageMultiple2: "頻繁に訪れていますね。<br>本当に今、必要ですか?",
        btnBack: "作業に戻る",
        btnEdit: "編集",
        timeModal: "許可時間を設定",
        minutes: "分間",
        cancel: "キャンセル",
        confirm: "決定",
        validationError: "1〜1440分の範囲で入力してください",
        loading: "読み込み中..."
    },
    
    // Popup
    popup: {
        title: "Flux",
        extensionToggle: "拡張機能",
        toggleDescription: "ブロック機能の有効/無効",
        statusActive: "Active",
        statusInactive: "Inactive",
        blockedSites: "Blocked Sites",
        activeNow: "Active Now",
        openSettings: "設定を開く"
    },
    
    // Settings - Sidebar
    sidebar: {
        blockSite: "ブロックするサイト",
        feedback: "フィードバック",
        update: "アップデート情報",
        howToUse: "使い方ガイド",
        language: "言語設定",
        close: "← 閉じる"
    },
    
    // Settings - Block Site Section
    blockSite: {
        title: "ブロックするサイト",
        description: "集中を妨げるサイトを登録できます。<br>アクセスは一度ブロックされ、許可の為にワンステップ必要です。",
        addNew: "新しいサイトを追加",
        placeholder: "example.com",
        quickAdd: "Quick Add:",
        registered: "登録済みサイト",
        count: "件",
        empty: "まだサイトが登録されていません。",
        defaultTime: "デフォルト:",
        timeLabel: "デフォルトの許可時間",
        applyToAll: "全てに適用",
        applyToAllConfirm: "全てのサイトの許可時間を {time} に設定しますか?",
        sliderMin: "1分",
        sliderMax: "3時間",
        adding: "追加中...",
        invalidDomain: "ドメイン名が無効です。例: youtube.com",
        addError: "エラー: 拡張機能を再読み込みしてください。",
        addFailed: "追加に失敗しました: ",
        deleteTitle: "削除",
        deleteFailed: "削除に失敗しました"
    },
    
    // Settings - Feedback Section
    feedback: {
        title: "フィードバック",
        description: "ご意見・ご要望をお聞かせください。",
        name: "お名前（任意）",
        namePlaceholder: "山田太郎",
        email: "メールアドレス（任意） - 入力すると返信が可能です。希望する場合はメッセージにてその旨をご記入ください。",
        emailPlaceholder: "example@email.com",
        type: "フィードバックの種類",
        typeSelect: "選択してください",
        typeBug: "バグ報告",
        typeFeature: "機能要望",
        typeImprovement: "改善提案",
        typeOther: "その他",
        message: "メッセージ *",
        messagePlaceholder: "詳細をお聞かせください...",
        submit: "送信する",
        submitting: "送信中...",
        success: "フィードバックを送信しました。ありがとうございます！",
        error: "エラーが発生しました。もう一度お試しください。"
    },
    
    // Settings - Update Section
    update: {
        title: "アップデート情報",
        description: "Fluxの最新情報をお届けします。",
        version: "v1.0.0",
        date: "2025-01-01",
        releaseTitle: "初回リリース 🎉",
        feature1: "サイトブロック機能の実装",
        feature2: "一時解除機能の追加",
        feature3: "ドメインごとのデフォルト時間設定",
        feature4: "意図的なアクセスを促すUI/UX",
        roadmapTitle: "今後の予定",
        roadmap1Title: "統計機能",
        roadmap1Desc: "ブロックした回数や時間を可視化",
        roadmap2Title: "スケジュール機能",
        roadmap2Desc: "時間帯によるブロック設定",
        roadmap3Title: "グループ機能",
        roadmap3Desc: "サイトをカテゴリ分けして管理"
    },
    
    // Settings - How to Use Section
    howToUse: {
        title: "使い方ガイド",
        description: "Fluxの基本的な使い方をご紹介します。",
        addTitle: "サイトの追加方法",
        addStep1: "「ブロックするサイト」セクションに移動します。",
        addStep2: "入力欄にブロックしたいサイトのドメインを入力します（例: example.com）。",
        addStep3: "「+」ボタンをクリックしてサイトを追加します。",
        removeTitle: "サイトの削除方法",
        removeStep1: "「ブロックするサイト」セクションに移動します。",
        removeStep2: "登録済みサイトリストから削除したいサイトを見つけます。",
        removeStep3: "各サイトの横にある「×」ボタンをクリックしてサイトを削除します。"
    },
    
    // Settings - Language Section
    language: {
        title: "言語設定",
        description: "表示言語を選択してください。",
        select: "言語を選択:",
        japanese: "日本語",
        english: "English"
    },
    
    // Time format
    time: {
        minutes: "{num}分",
        hours: "{num}時間",
        hoursMinutes: "{hours}時間{minutes}分"
    },

    modal: {
        title: "確認",
        cancel: "キャンセル",
        confirm: "適用する"
    }
};